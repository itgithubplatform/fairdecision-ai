import { askVertex } from "@/lib/vertex"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json()
    const rawResponse = await askVertex(prompt)
    const blockRegex = /\{([\s\S]*?)\}/
    const blockMatch = rawResponse.match(blockRegex)

    if (!blockMatch) {
      return NextResponse.json({ error: "No data block found" }, { status: 422 })
    }

    const content = blockMatch[1]
    const ruleRegex = /"ruleText"\s*:\s*"([\s\S]*?)"/
    const categoryRegex = /"category"\s*:\s*"([\s\S]*?)"/

    const ruleMatch = content.match(ruleRegex)
    const categoryMatch = content.match(categoryRegex)

    if (!ruleMatch || !categoryMatch) {
      return NextResponse.json({ error: "Missing keys in block" }, { status: 422 })
    }

    const cleanRule = ruleMatch[1]
      .replace(/\\n/g, ' ')  
      .replace(/\s+/g, ' ') 
      .trim()

    const cleanCategory = categoryMatch[1].trim()

    return NextResponse.json({ 
      ruleText: cleanRule, 
      category: cleanCategory 
    })

  } catch (error) {
    console.log("Error occurred while generating rule:", error);

    return NextResponse.json({ error: "Parser Crash" }, { status: 500 })
  }
}