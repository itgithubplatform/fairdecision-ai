import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Guardrail API response shapes
interface EvaluationResponse {
  action: string;
  details?: {
    top_threat: string;
    threat_score: number;
    top_rule: string;
    rule_score: number;
    candidate_rules?: string[];
  };
  top_threat?: string;
  threat_score?: number;
  roberta_latency_ms?: number;
}

// Auditor API response shape
interface AuditResponse {
  final_verdict: "AGREE" | "FALSE_POSITIVE" | "FALSE_NEGATIVE";
  step_by_step_reasoning: string;
  suggested_rule_update?: string;
}

function computeRiskLevel(threatScore: number, action: string): string {
  if (action === "AUTO_BLOCKED" || threatScore >= 0.8) return "HIGH";
  if (threatScore >= 0.5) return "MEDIUM";
  return "LOW";
}

function computeFinalScore(
  threatScore: number,
  verdict: string
): number {
  // Start from threat score (0-1), adjust based on auditor verdict
  let base = 1 - threatScore; // Higher = safer
  if (verdict === "FALSE_NEGATIVE") base = Math.max(0, base - 0.2); // Guardrail missed it
  if (verdict === "FALSE_POSITIVE") base = Math.min(1, base + 0.15); // Guardrail over-reacted
  return Math.round(base * 100) / 100;
}

// ─── Step 1: Guardrail Evaluation ───────────────────────────────────────────
export async function processSingleRecord(recordId: string) {
  const record = await prisma.csvRecord.findUnique({ where: { id: recordId } });
  if (!record || record.status !== "PENDING") return;

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

    const threatLabel = data.details?.top_threat  ?? data.top_threat  ?? null;
    const threatScore = data.details?.threat_score ?? data.threat_score ?? 0;
    const ruleMatched = data.details?.top_rule     ?? null;
    const ruleScore   = data.details?.rule_score   ?? 0;

    await prisma.csvRecord.update({
      where: { id: record.id },
      data: {
        status: "PROCESSED",
        action: data.action,
        threatLabel,
        threatScore,
        ruleMatched,
        ruleScore,
        processedAt: new Date(),
      },
    });

    return { action: data.action, threatLabel, threatScore, ruleMatched };
  } catch (error) {
    console.error(`[Guardrail] Failed for record ${record.id}:`, error);
    try {
      await prisma.csvRecord.update({
        where: { id: record.id },
        data: { status: "ERROR", processedAt: new Date() },
      });
    } catch (_) {}
    return null;
  }
}

// ─── Step 2: Auditor Verification ───────────────────────────────────────────
export async function auditSingleRecord(recordId: string) {
  const record = await prisma.csvRecord.findUnique({ where: { id: recordId } });
  if (!record || record.status !== "PROCESSED") return;

  try {
    const response = await fetch("http://127.0.0.1:4000/api/audit/process/" + record.id, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) throw new Error(`Auditor API Failed: ${response.statusText}`);

    const data: { success: boolean; data?: { audit_verdict?: string; audit_reasoning?: string; audit_suggestion?: string } } = await response.json();

    const verdict = (data.data?.audit_verdict ?? "AGREE") as string;
    const riskLevel = computeRiskLevel(record.threatScore ?? 0, record.action ?? "AUTO_PASSED");
    const finalScore = computeFinalScore(record.threatScore ?? 0, verdict);

    await prisma.csvRecord.update({
      where: { id: record.id },
      data: {
        status: "AUDITED",
        auditVerdict: verdict,
        auditReasoning: data.data?.audit_reasoning ?? null,
        auditSuggestion: data.data?.audit_suggestion ?? null,
        riskLevel,
        finalScore,
        auditedAt: new Date(),
      },
    });
  } catch (error) {
    console.error(`[Auditor] Failed for record ${record.id}:`, error);
    // Still mark as AUDITED with computed local risk — auditor being down shouldn't stall the pipeline
    const riskLevel = computeRiskLevel(record.threatScore ?? 0, record.action ?? "AUTO_PASSED");
    const finalScore = computeFinalScore(record.threatScore ?? 0, "AGREE");
    try {
      await prisma.csvRecord.update({
        where: { id: record.id },
        data: { status: "AUDITED", riskLevel, finalScore, auditedAt: new Date() },
      });
    } catch (_) {}
  }
}

// ─── Main Worker: Sequential, take:1 per fetch cycle ────────────────────────
export async function startCsvWorker(batchId: string) {
  console.log(`[Worker] Starting batch: ${batchId}`);

  try {
    await prisma.csvBatch.update({
      where: { id: batchId },
      data: { status: "PROCESSING" },
    });

    // ── Phase 1: Guardrail evaluation (take:1 per loop iteration) ──
    let guardrailCount = 0;
    while (true) {
      const pending = await prisma.csvRecord.findMany({
        where: { batchId, status: "PENDING" },
        select: { id: true },
        take: 1,  // Process ONE at a time
      });

      if (pending.length === 0) break;

      await processSingleRecord(pending[0].id);
      guardrailCount++;

      await prisma.csvBatch.update({
        where: { id: batchId },
        data: { processed: guardrailCount },
      });
    }

    console.log(`[Worker] Guardrail phase complete for batch ${batchId}. Starting auditor phase.`);

    // ── Phase 2: Auditor verification (take:1 per loop iteration) ──
    let auditCount = 0;
    while (true) {
      const processed = await prisma.csvRecord.findMany({
        where: { batchId, status: "PROCESSED" },
        select: { id: true },
        take: 1,  // Process ONE at a time
      });

      if (processed.length === 0) break;

      await auditSingleRecord(processed[0].id);
      auditCount++;

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
