import { NextResponse } from "next/server"
import { prisma } from "@/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { VertexAI } from "@google-cloud/vertexai";

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { promptText, fastEngineDecision, resolutionContext, intendedDecision } = body

    const session = await getServerSession(authOptions)
    if (!promptText || !resolutionContext || !intendedDecision) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }
    if(!session||!session.user){
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
    const activeUserId = session.user.id

    const existingPromptRule = await prisma.customRule.findFirst({
      where: {
        sourcePrompt: promptText,
        userId: activeUserId
      }
    });

    if (existingPromptRule) {
      return NextResponse.json({
        action: intendedDecision, 
        proposedRuleText: existingPromptRule.ruleText,
        reasoning: "Looks like a similar rule already exists. You can delete it if you want to create a new one.",
        category: existingPromptRule.category,
        id: existingPromptRule.id,
        isDuplicate: true 
      }, { status: 200 });
    }

   const prompt = `
      You are an enterprise AI Security Firewall Rule Generator.
      Your job is to write a highly condensed, zero-shot classifier trigger to fix a semantic firewall mistake.

      --- INCIDENT DATA ---
      Evaluated Prompt: "${promptText}"
      Engine Decision: ${fastEngineDecision}
      Target Decision: ${intendedDecision}
      Context for Fix: ${resolutionContext}
      
      --- INSTRUCTIONS ---
      1. ZERO-SHOT OPTIMIZED RULE: Write a strict, pure semantic trigger (maximum 7 to 10 words). 
      2. NO EXPLANATIONS: Do NOT include reasoning in the rule text. Never use words like "because," "as this can be," or "due to." Save the 'why' for the reasoning field.
      3. CLASSIFY: Set the category (e.g., 'Age Bias', 'National Origin Bias', 'Toxicity', 'General Compliance').
      4. STRICT JSON: Return pure JSON only. No markdown, no backticks, no preamble.
      EXPECTED SCHEMA:
      {
        "action": "ALLOW" | "BLOCK",
        "proposedRuleText": "string", 
        "reasoning": "string",        
        "category": "string"
      }
    `
    const vertexAI = new VertexAI({ 
          project: process.env.GOOGLE_PROJECT_ID!, 
          googleAuthOptions: {
            credentials: JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS || "{}")
          }
        });
    
    const model = vertexAI.getGenerativeModel({
      model: 'gemini-2.5-flash-lite', 
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1,
      }
    });
        
    const res = await model.generateContent(prompt)
    const rawResponse = res.response.candidates?.[0]?.content.parts?.[0]?.text;
    
    if (!rawResponse) throw new Error("Vertex AI returned an empty response.");
    
    let generatedRule;
    try {
      const cleanedResponse = rawResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      generatedRule = JSON.parse(cleanedResponse);
    } catch (parseError) {
      return NextResponse.json({ error: "AI failed to return valid JSON" }, { status: 502 })
    }

    const existingRuleText = await prisma.customRule.findFirst({
      where: { ruleText: generatedRule.proposedRuleText, userId: activeUserId }
    });

    return NextResponse.json({
      ...generatedRule,
      isDuplicate: !!existingRuleText 
    }, { status: 200 })

  } catch (error) {
    console.error("[HEAL_RULE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}