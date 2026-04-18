import { PrismaClient } from "@prisma/client";

// Instantiate the Prisma Client directly in this file
// This guarantees your editor accurately detects the types.
const prisma = new PrismaClient();

// Matches BOTH response shapes from main.py /evaluate:
// - Fast-block path (toxicity >= 0.85): { action, top_threat, threat_score, roberta_latency_ms }
// - Normal path: { action, details: { top_threat, threat_score, top_rule, rule_score, ... }, latency_ms }
interface EvaluationResponse {
  action: string;
  // Normal evaluation path
  details?: {
    top_threat: string;
    threat_score: number;
    top_rule: string;
    rule_score: number;
    candidate_rules?: string[];
  };
  // Fast-block path fields (top-level when toxicity >= 0.85)
  top_threat?: string;
  threat_score?: number;
  roberta_latency_ms?: number;
}

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

    if (!response.ok) {
      throw new Error(`Realtime API Failed: ${response.statusText}`);
    }

    const data: EvaluationResponse = await response.json();

    // Normalise: fast-block path puts threat info at top level, normal path nests it in details
    const threatLabel  = data.details?.top_threat  ?? data.top_threat  ?? null;
    const threatScore  = data.details?.threat_score ?? data.threat_score ?? 0;
    const ruleMatched  = data.details?.top_rule     ?? null;
    const ruleScore    = data.details?.rule_score   ?? 0;

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
  } catch (error) {
    console.error(`Failed to process CSV Record ${record.id}:`, error);
    // Nested try-catch: prevents a DB failure here from crashing the outer worker loop
    try {
      await prisma.csvRecord.update({
        where: { id: record.id },
        data: { status: "ERROR", processedAt: new Date() },
      });
    } catch (dbError) {
      console.error(`Failed to mark record ${record.id} as ERROR in DB:`, dbError);
    }
  }
}

export async function startCsvWorker(batchId: string) {
  console.log(`Starting background processing for Batch ID: ${batchId}`);

  try {
    const batch = await prisma.csvBatch.findUnique({
      where: { id: batchId },
      include: { records: { where: { status: "PENDING" }, select: { id: true } } },
    });

    if (!batch || batch.records.length === 0) return;

    let processedCount = batch.processed;

    // Process exactly ONE BY ONE sequentially
    for (const rec of batch.records) {
      await processSingleRecord(rec.id);

      processedCount++;
      // Write to DB every 10 records or at the last record to minimise DB round-trips
      if (processedCount % 10 === 0 || processedCount === batch.totalRows) {
        await prisma.csvBatch.update({
          where: { id: batch.id },
          data: {
            processed: processedCount,
            status: processedCount >= batch.totalRows ? "COMPLETED" : "PROCESSING",
          },
        });
      }
    }

    // Final safety write — always forces COMPLETED regardless of totalRows drift
    await prisma.csvBatch.update({
      where: { id: batch.id },
      data: {
        processed: processedCount,
        status: "COMPLETED",
      },
    });

    console.log(`Finished processing Batch ID: ${batchId}`);
  } catch (error) {
    console.error(`Fatal error in CSV Worker for Batch ${batchId}:`, error);
    await prisma.csvBatch.update({
      where: { id: batchId },
      data: { status: "FAILED" },
    });
  }
}
