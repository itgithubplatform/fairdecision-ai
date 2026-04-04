import os
import time
import torch
import faiss
from fastapi import FastAPI
from pydantic import BaseModel
from sentence_transformers import SentenceTransformer
from transformers import pipeline, AutoTokenizer
from optimum.onnxruntime import ORTModelForSequenceClassification

app = FastAPI(title="Compliance & Toxicity Evaluation API")

provider = "CUDAExecutionProvider" if torch.cuda.is_available() else "CPUExecutionProvider"

# --- Define Local Paths for ONNX Models ---
ROBERTA_ONNX_PATH = "./models/roberta_onnx"
DEBERTA_ONNX_PATH = "./models/deberta_onnx"

print("Loading MiniLM Bi-Encoder for FAISS Retrieval...")
retriever = SentenceTransformer("all-MiniLM-L6-v2", device="cuda" if torch.cuda.is_available() else "cpu")

# ==========================================
# ROBERTA SETUP (Compile once, load locally thereafter)
# ==========================================
roberta_id = "unitary/unbiased-toxic-roberta"

if not os.path.exists(ROBERTA_ONNX_PATH):
    print("Compiling Toxicity Classifier to ONNX for the first time...")
    roberta_tokenizer = AutoTokenizer.from_pretrained(roberta_id, use_fast=True)
    roberta_ort = ORTModelForSequenceClassification.from_pretrained(roberta_id, export=True, provider=provider)
    
    # Save the compiled model and tokenizer locally
    roberta_tokenizer.save_pretrained(ROBERTA_ONNX_PATH)
    roberta_ort.save_pretrained(ROBERTA_ONNX_PATH)
else:
    print("Loading pre-compiled Toxicity Classifier from local storage...")
    roberta_tokenizer = AutoTokenizer.from_pretrained(ROBERTA_ONNX_PATH, use_fast=True)
    # export=False because it's already an ONNX model
    roberta_ort = ORTModelForSequenceClassification.from_pretrained(ROBERTA_ONNX_PATH, provider=provider)

roberta = pipeline(
    "text-classification", model=roberta_ort, tokenizer=roberta_tokenizer,
    top_k=None, device=0 if torch.cuda.is_available() else -1
)

# ==========================================
# DEBERTA SETUP (Compile once, load locally thereafter)
# ==========================================
deberta_id = "cross-encoder/nli-deberta-v3-small"

if not os.path.exists(DEBERTA_ONNX_PATH):
    print("Compiling DeBERTa SLM to ONNX for the first time...")
    deberta_tokenizer = AutoTokenizer.from_pretrained(deberta_id, use_fast=True)
    deberta_ort = ORTModelForSequenceClassification.from_pretrained(deberta_id, export=True, provider=provider)
    
    # Save the compiled model and tokenizer locally
    deberta_tokenizer.save_pretrained(DEBERTA_ONNX_PATH)
    deberta_ort.save_pretrained(DEBERTA_ONNX_PATH)
else:
    print("Loading pre-compiled DeBERTa SLM from local storage...")
    deberta_tokenizer = AutoTokenizer.from_pretrained(DEBERTA_ONNX_PATH, use_fast=True)
    deberta_ort = ORTModelForSequenceClassification.from_pretrained(DEBERTA_ONNX_PATH, provider=provider)

deberta = pipeline(
    "zero-shot-classification", model=deberta_ort, tokenizer=deberta_tokenizer,
    device=0 if torch.cuda.is_available() else -1
)

print("All Models & Vector DB Successfully Loaded.")

# ... (The rest of your code remains exactly the same starting from the Rules & Constants) ...
# --- Rules & Constants ---
COMPLIANCE_RULES = [
    "Gender or sex discrimination",
    "Age discrimination or graduation year filtering",
    "Discrimination favoring young or recent graduates",
    "Discrimination against family responsibilities or preference for young, single workers",
    "Geographic, regional, IP or location-based discrimination",
    "Racial discrimination, name-based bias, or exclusionary culture fit",
    "Socioeconomic, income, or immigration status discrimination",
]
SAFE_RULES = [
    "Strict fairness, equality, and anti-discrimination policy",
    "Merit-based filtering, qualifications, or standard request"
]
ALL_RULES = COMPLIANCE_RULES
THREAT_LABELS = {"toxicity", "severe_toxicity", "obscene", "threat", "insult", "identity_attack"}

print("Embedding Rules into FAISS Index...")
rule_embeddings = retriever.encode(COMPLIANCE_RULES, convert_to_numpy=True)
dimension = rule_embeddings.shape[1]

index = faiss.IndexFlatIP(dimension)
faiss.normalize_L2(rule_embeddings)
index.add(rule_embeddings)

# --- Warmup Models ---
print("Warming up models...")
_ = roberta("Warmup text")
_ = deberta("Warmup text", candidate_labels=["Warmup label"])
_ = retriever.encode(["Warmup text"])
print("Server Ready!")


# ==========================================
# 2. REQUEST SCHEMA & API ROUTE
# ==========================================

class EvaluationRequest(BaseModel):
    domain: str
    text: str

@app.post("/evaluate")
def evaluate_text(req: EvaluationRequest):
    augmented_prompt = f"{req.domain}: {req.text}"
    
    # --- 1. RoBERTa Toxicity Check ---
    start_roberta = time.perf_counter()
    roberta_res = roberta(req.text)[0]
    roberta_time = (time.perf_counter() - start_roberta) * 1000

    actual_threats = [item for item in roberta_res if item['label'] in THREAT_LABELS]
    top_threat = max(actual_threats, key=lambda x: x['score']) if actual_threats else {'label': 'toxicity', 'score': 0.0}

    # Explicit Toxicity Rule
    if top_threat['score'] >= 0.85:
        return {
            "action": "🔴 AUTO_BLOCKED (Explicit Toxicity)",
            "top_threat": top_threat['label'],
            "threat_score": top_threat['score'],
            "roberta_latency_ms": round(roberta_time, 2)
        }

    # --- 2. FAISS Retrieval ---
    start_retrieval = time.perf_counter()
    prompt_emb = retriever.encode([augmented_prompt], convert_to_numpy=True)
    faiss.normalize_L2(prompt_emb)

    k_rules = 1
    distances, indices = index.search(prompt_emb, k_rules)
    
    candidate_rules = [ALL_RULES[idx] for idx in indices[0]]
    if not any(rule in SAFE_RULES for rule in candidate_rules):
        candidate_rules.append(SAFE_RULES[1])

    retrieval_time = (time.perf_counter() - start_retrieval) * 1000

    # --- 3. DeBERTa Classification ---
    start_deberta = time.perf_counter()
    deberta_res = deberta(
        augmented_prompt,
        candidate_labels=candidate_rules+SAFE_RULES,
        multi_label=True,
        truncation=True
    )
    deberta_time = (time.perf_counter() - start_deberta) * 1000

    top_rule = deberta_res['labels'][0]
    top_score = deberta_res['scores'][0]
    
    total_time = roberta_time + retrieval_time + deberta_time

    # --- 4. Logic & Rules Enforcement ---
    action = ""
    if top_rule in SAFE_RULES and top_score > 0.45:
        action = "🟢 AUTO_PASSED (Fairness/Equality Statement)"
    elif top_score >= 0.66:
        action = f"🔴 AUTO_BLOCKED ({top_rule})"
    elif top_score >= 0.50 or top_threat['score'] >= 0.50:
        action = "🟡 QUARANTINED (Ambiguous - Needs Review)"
    else:
        action = "🟢 AUTO_PASSED (Safe)"

    # --- Return JSON Response ---
    return {
        "action": action,
        "details": {
            "top_threat": top_threat['label'],
            "threat_score": round(top_threat['score'], 4),
            "top_rule": top_rule,
            "rule_score": round(top_score, 4),
            "candidate_rules": candidate_rules
        },
        "latency_ms": {
            "roberta": round(roberta_time, 2),
            "faiss": round(retrieval_time, 2),
            "deberta": round(deberta_time, 2),
            "total": round(total_time, 2)
        }
    }
