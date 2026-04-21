import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const batch = await prisma.csvBatch.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    const records = await prisma.csvRecord.findMany({
      where: { batchId: id },
      orderBy: { createdAt: "asc" },
    });

    // Aggregate stats
    const stats = {
      total: records.length,
      blocked: records.filter((r) => r.action === "AUTO_BLOCKED").length,
      passed: records.filter((r) => r.action === "AUTO_PASSED").length,
      errors: records.filter((r) => r.status === "ERROR").length,
      highRisk: records.filter((r) => r.riskLevel === "HIGH").length,
      mediumRisk: records.filter((r) => r.riskLevel === "MEDIUM").length,
      lowRisk: records.filter((r) => r.riskLevel === "LOW").length,
      falsePositives: records.filter((r) => r.auditVerdict === "FALSE_POSITIVE").length,
      falseNegatives: records.filter((r) => r.auditVerdict === "FALSE_NEGATIVE").length,
      avgFinalScore:
        records.filter((r) => r.finalScore != null).length > 0
          ? +(
              records
                .filter((r) => r.finalScore != null)
                .reduce((sum, r) => sum + (r.finalScore ?? 0), 0) /
              records.filter((r) => r.finalScore != null).length
            ).toFixed(3)
          : null,
    };

    return NextResponse.json({ success: true, batch, records, stats });
  } catch (error) {
    console.error("Batch Detail Error:", error);
    return NextResponse.json({ error: "Failed to fetch batch details" }, { status: 500 });
  }
}
