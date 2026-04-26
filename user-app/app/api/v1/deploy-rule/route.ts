// app/api/v1/deploy-rule/route.ts
import { NextResponse } from "next/server"
import { prisma } from "@/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { ruleText, sourcePrompt, category } = body;

    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (!ruleText || !sourcePrompt || !category) {
      return NextResponse.json({ error: "Missing required fields for deployment" }, { status: 400 });
    }

    const dbRule = await prisma.customRule.create({
      data: {
        ruleText: ruleText,
        sourcePrompt: sourcePrompt, 
        category: category,
        userId: session.user.id,
        isActive: true,
        isSystem: false,
      }
    });

    return NextResponse.json({ success: true, ruleId: dbRule.id }, { status: 200 });

  } catch (error) {
    console.error("[DEPLOY_RULE_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}