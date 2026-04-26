import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "@/prisma"
import { parse } from "csv-parse/sync";
import { startCsvWorker } from "@/lib/csvWorker";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB size limit" }, { status: 400 });
    }
    
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });
    }

    const text = await file.text();
    
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    if (records.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 });
    }
    
    const batch = await prisma.csvBatch.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        totalRows: records.length,
        status: "PROCESSING"
      }
    });

    const dbRecords = records.map((rec: any) => {
      const textCol = Object.keys(rec).find(k => /text|prompt|query|desc|comment/i.test(k));
      const textToEvaluate = textCol ? String(rec[textCol]) : Object.values(rec).join(" ");
      
      return {
        batchId: batch.id,
        originalRow: JSON.stringify(rec),
        textToEvaluate: textToEvaluate.substring(0, 5000) 
      };
    });
    await prisma.csvRecord.createMany({
      data: dbRecords
    });

    startCsvWorker(batch.id).catch(console.error);

    return NextResponse.json({ 
      success: true, 
      batchId: batch.id,
      totalRows: records.length,
      message: "File uploaded successfully. Processing started in background."
    });

  } catch (error) {
    console.error("Upload Error:", error);
    return NextResponse.json({ error: "Failed to process CSV upload" }, { status: 500 });
  }
}
