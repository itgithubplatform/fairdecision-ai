import os
import time
import gc
import torch
import faiss
import numpy as np
from functools import lru_cache
from fastapi import FastAPI
from pydantic import BaseModel
from typing import List, Optional
from sentence_transformers import SentenceTransformer
from transformers import pipeline, AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification
from optimum.onnxruntime import ORTQuantizer
from optimum.onnxruntime.configuration import AutoQuantizationConfig

app = FastAPI(title="Aegis Inference Engine")

provider = "CUDAExecutionProvider" if torch.cuda.is_available() else "CPUExecutionProvider"

ROBERTA_QUANTIZED_PATH = "./models/roberta_onnx_quantized"
DEBERTA_ONNX_PATH = "./models/deberta_onnx"

print("Loading MiniLM Bi-Encoder for FAISS Retrieval...")
retriever = SentenceTransformer("all-MiniLM-L6-v2", device="cuda" if torch.cuda.is_available() else "cpu")

roberta_id = "unitary/unbiased-toxic-roberta"
if not os.path.exists(ROBERTA_QUANTIZED_PATH):
    print("Compiling Toxicity Classifier to ONNX...")
    roberta_tokenizer = AutoTokenizer.from_pretrained(roberta_id, use_fast=True)
    roberta_ort = ORTModelForSequenceClassification.from_pretrained(roberta_id, export=True, provider=provider)
    
    quantizer = ORTQuantizer.from_pretrained(roberta_ort)
    dqconfig = AutoQuantizationConfig.avx512_vnni(is_static=False, per_channel=False)
    quantizer.quantize(save_dir=ROBERTA_QUANTIZED_PATH, quantization_config=dqconfig)
    roberta_tokenizer.save_pretrained(ROBERTA_QUANTIZED_PATH)
    
    del roberta_ort
    del quantizer
    gc.collect()

print("Loading Quantized Toxicity Classifier...")
roberta_tokenizer = AutoTokenizer.from_pretrained(ROBERTA_QUANTIZED_PATH, use_fast=True)
roberta_ort = ORTModelForSequenceClassification.from_pretrained(
    ROBERTA_QUANTIZED_PATH, file_name="model_quantized.onnx", provider=provider
)
roberta = pipeline(
    "text-classification", model=roberta_ort, tokenizer=roberta_tokenizer,
    top_k=None, device=0 if torch.cuda.is_available() else -1
)

deberta_id = "MoritzLaurer/deberta-v3-xsmall-zeroshot-v1.1-all-33"
if not os.path.exists(DEBERTA_ONNX_PATH):
    print(f"Compiling {deberta_id} to ONNX...")
    deberta_tokenizer = AutoTokenizer.from_pretrained(deberta_id, use_fast=True)
    deberta_ort = ORTModelForSequenceClassification.from_pretrained(deberta_id, export=True, provider=provider)
    deberta_ort.save_pretrained(DEBERTA_ONNX_PATH)
    deberta_tokenizer.save_pretrained(DEBERTA_ONNX_PATH)
    del deberta_ort
    gc.collect()

print("Loading FP32 DeBERTa SLM...")
deberta_tokenizer = AutoTokenizer.from_pretrained(DEBERTA_ONNX_PATH, use_fast=True)
deberta_ort = ORTModelForSequenceClassification.from_pretrained(
    DEBERTA_ONNX_PATH, file_name="model.onnx", provider=provider
)
deberta = pipeline(
    "zero-shot-classification", model=deberta_ort, tokenizer=deberta_tokenizer,
    device=0 if torch.cuda.is_available() else -1
)

print("All Models Loaded.")

@lru_cache(maxsize=10000)
def get_single_embedding(text: str):
    return retriever.encode([text], convert_to_numpy=True)[0]

def get_rule_embeddings(rules: List[str]) -> np.ndarray:
    vectors = [get_single_embedding(rule) for rule in rules]
    return np.vstack(vectors)
def build_response(all_threats, top_threat, semantic_rule, semantic_score, t1, t2=0, t3=0):
    significant_threats = [
        {"label": t["label"], "score": round(float(t["score"]), 4)} 
        for t in all_threats if t["score"] > 0.1
    ]
    
    return {
        "toxicity": {
            "primary_threat": top_threat['label'],
            "max_score": round(float(top_threat['score']), 4),
            "all_threats": significant_threats
        },
        "semantic_match": {
            "rule": semantic_rule,
            "score": round(float(semantic_score), 4)
        },
        "telemetry": {
            "stage_1_ms": round(t1, 2),
            "retrieval_ms": round(t2, 2),
            "stage_2_ms": round(t3, 2),
            "total_ms": round(t1 + t2 + t3, 2)
        }
    }

DEFAULT_COMPLIANCE_RULES = [
    "Gender or sex discrimination",
    "Age discrimination or graduation year filtering",
    "Discrimination favoring young or recent graduates",
    "Discrimination against family responsibilities or preference for young, single workers",
    "Geographic, regional, IP or location-based discrimination",
    "Racial discrimination, name-based bias, or exclusionary culture fit",
    "Socioeconomic, income, or immigration status discrimination",
    "digital natives filtering"
]
SAFE_RULES = [
    "Strict fairness, equality, and anti-discrimination policy",
    "Merit-based filtering, qualifications, or standard request"
]
THREAT_LABELS = {"toxicity", "severe_toxicity", "obscene", "threat", "insult", "identity_attack"}

print("Warming up models...")
_ = roberta("Warmup text")
_ = deberta("Warmup text", candidate_labels=["Warmup label"])
_ = retriever.encode(["Warmup text"])
print("Server Ready!")

class EvaluationRequest(BaseModel):
    domain: str = "General"
    text: str
    custom_rules: Optional[List[str]] = None 

class WarmupRequest(BaseModel):
    new_rules: List[str]


@app.post("/warmup")
def warmup_cache(req: WarmupRequest):
    get_rule_embeddings(req.new_rules)
    return {"status": "Cache warmed", "rules_processed": len(req.new_rules)}

@app.post("/evaluate")
def evaluate_text(req: EvaluationRequest):
    augmented_prompt = f"{req.domain}: {req.text}"
    active_rules = req.custom_rules if req.custom_rules and len(req.custom_rules) > 0 else DEFAULT_COMPLIANCE_RULES

    start_t1 = time.perf_counter()
    roberta_res = roberta(req.text)[0]
    t1_ms = (time.perf_counter() - start_t1) * 1000

    actual_threats = [item for item in roberta_res if item['label'] in THREAT_LABELS]
    top_threat = max(actual_threats, key=lambda x: x['score']) if actual_threats else {'label': 'none', 'score': 0.0}

    if top_threat['score'] >= 0.85:
        return build_response(actual_threats, top_threat, "none", 0.0, t1_ms)
    start_t2 = time.perf_counter()
    
    rule_matrix = get_rule_embeddings(active_rules)
    dimension = rule_matrix.shape[1]
    
    index = faiss.IndexFlatIP(dimension)
    faiss.normalize_L2(rule_matrix)
    index.add(rule_matrix)

    prompt_emb = retriever.encode([augmented_prompt], convert_to_numpy=True)
    faiss.normalize_L2(prompt_emb)

    k_rules = min(1, len(active_rules))
    distances, indices = index.search(prompt_emb, k_rules)
    candidate_rules = [active_rules[idx] for idx in indices[0]]

    t2_ms = (time.perf_counter() - start_t2) * 1000

    start_t3 = time.perf_counter()
    
    evaluation_labels = candidate_rules + SAFE_RULES
    
    deberta_res = deberta(
        augmented_prompt,
        candidate_labels=evaluation_labels,
        multi_label=True,
        truncation=True
    )
    t3_ms = (time.perf_counter() - start_t3) * 1000

    top_rule = deberta_res['labels'][0]
    top_score = deberta_res['scores'][0]

    return build_response(actual_threats, top_threat, top_rule, top_score, t1_ms, t2_ms, t3_ms)