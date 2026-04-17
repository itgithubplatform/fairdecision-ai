import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Auth check
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const batches = await prisma.csvBatch.findMany({
      where: {
        userId: session.user.id
      },
      orderBy: {
        createdAt: "desc"
      },
      take: 20
    });

    return NextResponse.json({ success: true, batches });
  } catch (error) {
    console.error("Fetch Batches Error:", error);
    return NextResponse.json({ error: "Failed to fetch CSV batches" }, { status: 500 });
  }
}
