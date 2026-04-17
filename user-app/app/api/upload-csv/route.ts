import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import { parse } from "csv-parse/sync";
import { startCsvWorker } from "../../../lib/csvWorker";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB limit

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // Auth check
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    
    // File Size Check
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: "File exceeds 5MB size limit" }, { status: 400 });
    }
    
    // File format check
    if (!file.name.endsWith(".csv")) {
      return NextResponse.json({ error: "Only CSV files are allowed" }, { status: 400 });
    }

    const text = await file.text();
    
    // Parse CSV Text - assuming first row is header
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });
    
    if (records.length === 0) {
      return NextResponse.json({ error: "CSV file is empty or invalid" }, { status: 400 });
    }
    
    // We will evaluate the 'text' or 'prompt' or whichever column has the actual sentence.
    // Let's assume the user has a "prompt", "text", or "query" column, or we just stringify the row for eval.
    
    // Create the DB Batch
    const batch = await prisma.csvBatch.create({
      data: {
        userId: session.user.id,
        filename: file.name,
        totalRows: records.length,
        status: "PROCESSING"
      }
    });

    // Extract records to insert
    const dbRecords = records.map((rec: any) => {
      // Find the main textual column intelligently (text, prompt, query, description, etc)
      const textCol = Object.keys(rec).find(k => /text|prompt|query|desc|comment/i.test(k));
      const textToEvaluate = textCol ? String(rec[textCol]) : Object.values(rec).join(" ");
      
      return {
        batchId: batch.id,
        originalRow: JSON.stringify(rec),
        textToEvaluate: textToEvaluate.substring(0, 5000) // Ensure no super massive texts crash DB
      };
    });

    // Insert all records concurrently via createMany
    await prisma.csvRecord.createMany({
      data: dbRecords
    });

    // Start background processing WITHOUT awaiting it, returning response immediately
    // This allows the task to run independently in the background sequentially.
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
