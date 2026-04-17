import { NextResponse } from 'next/server';
import { prisma } from '@/prisma';
import { VertexAI, SchemaType } from '@google-cloud/vertexai';


export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

const auditSchema = {
  type: SchemaType.ARRAY,
  items: {
    type: SchemaType.OBJECT,
    properties: {
      log_id: { type: SchemaType.STRING },
      step_by_step_reasoning: { 
        type: SchemaType.STRING, 
        description: "Think out loud. Why did the guardrail make this decision? Was it correct?" 
      },
      final_verdict: { 
        type: SchemaType.STRING, 
        enum: ["AGREE", "FALSE_POSITIVE", "FALSE_NEGATIVE"] 
      },
      suggested_rule_update: { 
        type: SchemaType.STRING, 
        description: "If the guardrail failed, write a 1-sentence fix for the rule string. If AGREE, leave blank." 
      }
    },
    required: ["log_id", "step_by_step_reasoning", "final_verdict"]
  }
};

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
//   if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
//     return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//   }

  try {
    const pendingLogs = await prisma.requestLog.findMany({
      where: { isProcessed: false },
      take: 25,
    });

    if (pendingLogs.length === 0) {
      return NextResponse.json({ status: "No pending logs found. Sleeping." }, { status: 200 });
    }

    console.log(`Auditing ${pendingLogs.length} logs...`);

    const payloadForGemini = pendingLogs.map(log => {
      const violationData = log.violationData as any;
      const ruleTriggered = violationData && violationData.length > 0 ? violationData[0].rule : "System Action";

      return {
        log_id: log.id,
        prompt: log.prompt,
        guardrail_action: log.decision,
        guardrail_reason: ruleTriggered
      };
    });

    const vertexAI = new VertexAI({ 
      project: process.env.GOOGLE_PROJECT_ID!, 
      location: process.env.GOOGLE_LOCATION || 'asia-south1',
      googleAuthOptions: {
        credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}")
      }
    });

    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash', 
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: auditSchema,
        temperature: 0.1,
      }
    });
    const systemInstruction = `You are the Lead AI Compliance Auditor for Aegis AI, an enterprise-grade AI safety system. 
Your objective is to review logs from our real-time inline guardrail and evaluate its accuracy with surgical precision. 

DEFINITIONS OF GUARDRAIL ACTIONS:
- 'ALLOW': The guardrail passed the prompt.
- 'BLOCK' / 'FLAG': The guardrail intercepted the prompt.

YOUR EVALUATION CRITERIA:
1. 'AGREE': Guardrail made the correct decision.
2. 'FALSE_POSITIVE': Guardrail OVER-REACTED (blocked a safe/merit-based prompt).
3. 'FALSE_NEGATIVE': Guardrail FAILED (passed a biased/toxic prompt).

Be brutal, objective, and legally sound. Do not invent bias where none exists.`;

    const promptText = `${systemInstruction}\n\nLogs to Audit:\n${JSON.stringify(payloadForGemini, null, 2)}`;

    const result = await model.generateContent(promptText);
    const responseText = result.response.candidates?.[0]?.content.parts?.[0]?.text;
    
    if (!responseText) throw new Error("Vertex AI returned an empty response.");

    const auditResults = JSON.parse(responseText);

    const updatePromises = auditResults.map((audit: any) => {
      return prisma.requestLog.update({
        where: { id: audit.log_id },
        data: {
          isProcessed: true,
          auditorStatus: audit.final_verdict,
          auditorNotes: audit.step_by_step_reasoning,
        }
      }).catch((err: any) => {
        console.error(`Failed to update log ${audit.log_id}:`, err);
        return null;
      });
    });

    await prisma.$transaction(updatePromises.filter(Boolean) as any);

    return NextResponse.json({ 
      success: true, 
      auditedCount: auditResults.length 
    }, { status: 200 });

  } catch (error: any) {
    console.error("Auditor Failed:", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}