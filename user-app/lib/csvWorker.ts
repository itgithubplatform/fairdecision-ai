import { prisma } from "@/prisma";
import { VertexAI, SchemaType } from '@google-cloud/vertexai';

// Updated to match the new Python fast engine schema
interface EvaluationResponse {
  action?: string;
  toxicity?: {
    primary_threat: string;
    max_score: number;
    all_threats: string[];
  };
  semantic_match?: {
    rule: string;
    score: number;
  };
  telemetry?: {
    stage_1_ms: number;
    retrieval_ms: number;
    stage_2_ms: number;
    total_ms: number;
  };
}

const csvAuditSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      record_id: { type: SchemaType.STRING },
      audit_reasoning: { 
        type: SchemaType.STRING, 
        description: "Why did the engine make this decision? Under 20 words." 
      },
      audit_verdict: { 
        type: SchemaType.STRING, 
        enum: ["AGREE", "FALSE_POSITIVE", "FALSE_NEGATIVE"] 
      },
      audit_suggestion: { 
        type: SchemaType.STRING, 
        description: "Suggested rule update if verdict is not AGREE. Empty string if AGREE." 
      }
    },
    required: ["record_id", "audit_reasoning", "audit_verdict", "audit_suggestion"]
  }
};

function computeRiskLevel(threatScore: number, action: string): string {
  if (action === "AUTO_BLOCKED" || action === "BLOCK" || threatScore >= 0.8) return "HIGH";
  if (threatScore >= 0.5) return "MEDIUM";
  return "LOW";
}

function computeFinalScore(threatScore: number, verdict: string): number {
  let base = 1 - threatScore; 
  if (verdict === "FALSE_NEGATIVE") base = Math.max(0, base - 0.2); 
  if (verdict === "FALSE_POSITIVE") base = Math.min(1, base + 0.15); 
  return Math.round(base * 100) / 100;
}

// ─── Phase 1: Fast Guardrail ───────────────────────────────────────────────
export async function processSingleRecord(record: any) {
  try {
    const response = await fetch("http://127.0.0.1:8000/evaluate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        domain: "CSV Upload Evaluation",
        text: record.textToEvaluate,
      }),
    });

    if (!response.ok) throw new Error(`Guardrail API Failed: ${response.statusText}`);

    const data: EvaluationResponse = await response.json();

    // Map to the new schema
    const threatLabel = data.toxicity?.primary_threat ?? null;
    const threatScore = data.toxicity?.max_score ?? 0;
    const ruleMatched = data.semantic_match?.rule ?? null;
    const ruleScore   = data.semantic_match?.score ?? 0;
    
    // Safely determine the action if it isn't explicitly provided at the root
    let action = (data as any).action;
    if (!action) {
       action = (threatScore > 0.5 || ruleScore > 0.6) ? "AUTO_BLOCKED" : "AUTO_PASSED";
    }

    await prisma.csvRecord.update({
      where: { id: record.id },
      data: {
        status: "PROCESSED",
        action,
        threatLabel,
        threatScore,
        ruleMatched,
        ruleScore,
        processedAt: new Date(),
      },
    });
    return true;
  } catch (error) {
    console.error(`[Guardrail] Failed for record ${record.id}:`, error);
    await prisma.csvRecord.update({
      where: { id: record.id },
      data: { status: "ERROR", processedAt: new Date() },
    });
    return false;
  }
}

// ─── Phase 2: NATIVE Gemini Batch Auditing ──────────────────────────────────
export async function batchAuditRecords(records: any[]) {
  if (records.length === 0) return 0;

  try {
    const vertexAI = new VertexAI({ 
      project: process.env.GOOGLE_PROJECT_ID!, 
      googleAuthOptions: {
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}")
      }
    });

    const systemInstruction = `You are an expert AI Safety Auditor. Evaluate inline guardrail decisions.
Detect ALL explicit and subtle harms: toxicity, harassment, and proxy discrimination across age, gender, race, religion, disability, and class.

EVALUATION LOGIC:
- Guardrail Action: 'ALLOW' (passed) or 'BLOCK' (intercepted).
- 'AGREE': Guardrail was correct.
- 'FALSE_POSITIVE': Guardrail blocked safe/merit-based text.
- 'FALSE_NEGATIVE': Guardrail allowed biased/toxic text.`;

    const csvPayloadForGemini = records.map(record => ({
      record_id: record.id,
      prompt: record.textToEvaluate,
      guardrail_action: record.action || "UNKNOWN",
      threat_score: record.threatScore || 0,
      rule_matched: record.ruleMatched || "None"
    }));

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite', 
      generationConfig: { 
        responseMimeType: "application/json", 
        responseSchema: csvAuditSchema, 
        temperature: 0.1 
      }
    });

    const result = await model.generateContent(`${systemInstruction}\n\nCSV Records to Audit:\n${JSON.stringify(csvPayloadForGemini, null, 2)}`);
    const responseText = result.response.candidates?.[0]?.content.parts?.[0]?.text;

    if (!responseText) throw new Error("Empty response from Vertex AI");

    const auditResults = JSON.parse(responseText);
    const updatePromises: any[] = [];

    auditResults.forEach((audit: any) => {
      const originalRecord = records.find(r => r.id === audit.record_id);
      if (originalRecord) {
        const riskLevel = computeRiskLevel(originalRecord.threatScore || 0, originalRecord.action || "AUTO_PASSED");
        const finalScore = computeFinalScore(originalRecord.threatScore || 0, audit.audit_verdict);

        updatePromises.push(
          prisma.csvRecord.update({
            where: { id: originalRecord.id },
            data: {
              status: "AUDITED",
              auditVerdict: audit.audit_verdict,
              auditReasoning: audit.audit_reasoning,
              auditSuggestion: audit.audit_suggestion || null,
              riskLevel,
              finalScore,
              auditedAt: new Date(),
            }
          })
        );
      }
    });

    await Promise.all(updatePromises);
    return auditResults.length;

  } catch (error) {
    console.error(`[Auditor Batch] Failed:`, error);
    // If Vertex AI fails, cleanly mark them as audited with local logic so the pipeline doesn't freeze
    const fallbackPromises = records.map(record => {
      const riskLevel = computeRiskLevel(record.threatScore ?? 0, record.action ?? "AUTO_PASSED");
      const finalScore = computeFinalScore(record.threatScore ?? 0, "AGREE");
      return prisma.csvRecord.update({
        where: { id: record.id },
        data: { status: "AUDITED", riskLevel, finalScore, auditedAt: new Date() },
      });
    });
    await Promise.all(fallbackPromises);
    return records.length;
  }
}

// ─── Main Worker Execution ──────────────────────────────────────────────────
export async function startCsvWorker(batchId: string) {
  console.log(`[Worker] Starting event-driven batch: ${batchId}`);

  try {
    await prisma.csvBatch.update({ where: { id: batchId }, data: { status: "PROCESSING" } });

    // ── Phase 1: Guardrail evaluation (Chunks of 20 concurrently) ──
    let guardrailCount = 0;
    while (true) {
      const pending = await prisma.csvRecord.findMany({
        where: { batchId, status: "PENDING" },
        select: { id: true, textToEvaluate: true },
        take: 20, 
      });

      if (pending.length === 0) break;

      await Promise.all(pending.map(record => processSingleRecord(record)));
      guardrailCount += pending.length;

      await prisma.csvBatch.update({
        where: { id: batchId },
        data: { processed: guardrailCount },
      });
    }

    console.log(`[Worker] Guardrail phase complete. Starting Auditor phase.`);

    // ── Phase 2: Native Gemini Batch Auditing (Chunks of 50) ──
    let auditCount = 0;
    while (true) {
      const processed = await prisma.csvRecord.findMany({
        where: { batchId, status: "PROCESSED" },
        take: 50, 
      });

      if (processed.length === 0) break;

      const completed = await batchAuditRecords(processed);
      auditCount += completed;

      await prisma.csvBatch.update({
        where: { id: batchId },
        data: { auditorCompleted: auditCount },
      });
    }

    // ── Final: Mark batch COMPLETED ──
    const total = await prisma.csvRecord.count({ where: { batchId } });
    const audited = await prisma.csvRecord.count({ where: { batchId, status: "AUDITED" } });

    await prisma.csvBatch.update({
      where: { id: batchId },
      data: {
        processed: total,
        auditorCompleted: audited,
        status: "COMPLETED",
      },
    });

    console.log(`[Worker] Batch ${batchId} fully completed. ${audited}/${total} audited.`);
  } catch (error) {
    console.error(`[Worker] Fatal error in batch ${batchId}:`, error);
    await prisma.csvBatch.update({
      where: { id: batchId },
      data: { status: "FAILED" },
    });
  }
}