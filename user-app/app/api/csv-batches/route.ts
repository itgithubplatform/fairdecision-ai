import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const batches = await prisma.csvBatch.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        filename: true,
        totalRows: true,
        processed: true,
        auditorCompleted: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ success: true, batches });
  } catch (error) {
    console.error("Fetch Batches Error:", error);
    return NextResponse.json({ error: "Failed to fetch CSV batches" }, { status: 500 });
  }
}
