import { getAuthUser } from "@/lib/getAuthUser"
import { getUserRules } from "@/lib/getUserRules"
import { prisma } from "@/prisma"
import { NextResponse } from "next/server"

const TOX_BLOCK_THRESH = 0.85
const TOX_QUARANTINE_THRESH = 0.50

const NLP_BLOCK_THRESH = 0.66
const NLP_QUARANTINE_THRESH = 0.50
const NLP_SAFE_THRESH = 0.45

const SAFE_RULES = [
    "Strict fairness, equality, and anti-discrimination policy",
    "Merit-based filtering, qualifications, or standard request"
]

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const user = await getAuthUser(req)

        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
        if (!body.prompt) return NextResponse.json({ error: "Prompt required" }, { status: 400 })

        const userActionPref = body.action || "block" 
        const customRules = await getUserRules(user.id)
        console.log(customRules);

        const pyRes = await fetch("http://127.0.0.1:8000/evaluate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ domain: body.domain || "General", text: body.prompt, custom_rules: customRules })
        })

        if (!pyRes.ok) return NextResponse.json({ error: "Inference Engine Failed" }, { status: 502 })
        const { toxicity, semantic_match, telemetry } = await pyRes.json()

        let finalDecision: "ALLOW" | "QUARANTINE" | "FLAG" | "BLOCK" = "ALLOW"
        const violations = []

        if (toxicity.max_score >= TOX_QUARANTINE_THRESH && toxicity.primary_threat !== "none") {
            const severity = toxicity.max_score >= TOX_BLOCK_THRESH ? "BLOCK" : "QUARANTINE"
            
            violations.push({
                type: "TOXICITY",
                rule: toxicity.primary_threat,
                score: toxicity.max_score,
                severity: severity
            })
            if (severity === "BLOCK") finalDecision = "BLOCK"
            else if (severity === "QUARANTINE" && finalDecision === "ALLOW") finalDecision = "QUARANTINE"
        }

        const isSafeRuleOverride = SAFE_RULES.includes(semantic_match.rule) && semantic_match.score > NLP_SAFE_THRESH

        if (isSafeRuleOverride) {
            finalDecision = "ALLOW" 
        } 
        else if (semantic_match.score >= NLP_QUARANTINE_THRESH && semantic_match.rule !== "none") {
            const severity = semantic_match.score >= NLP_BLOCK_THRESH ? "BLOCK" : "QUARANTINE"
            
            violations.push({
                type: "CUSTOM_RULE",
                rule: semantic_match.rule,
                score: semantic_match.score,
                severity: severity
            })

            if (severity === "BLOCK") finalDecision = "BLOCK"
            else if (severity === "QUARANTINE" && finalDecision === "ALLOW") finalDecision = "QUARANTINE"
        }

        if (userActionPref === "flag" && finalDecision === "BLOCK") {
            finalDecision = "FLAG"
        }

        let reasonStr = "Prompt is safe."
        if (finalDecision === "QUARANTINE") reasonStr = "Ambiguous intent. Needs human review."
        if (finalDecision === "BLOCK" || finalDecision === "FLAG") reasonStr = `Violated ${violations.length} active policies.`
        if (isSafeRuleOverride) reasonStr = `Auto-Passed (Matched Safe Rule: ${semantic_match.rule})`

        const payload = {
            action: finalDecision,
            isSafe: finalDecision === "ALLOW",
            reason: reasonStr,
            violations,
            metrics: { latency_ms: telemetry.total_ms }
        }

        if (body.isPlayground || true) {
            await prisma.requestLog.create({
                data: {
                    prompt: body.prompt,
                    decision: finalDecision,
                    violationData: {
                        violations,
                        metrics: { latency_ms: telemetry.total_ms }
                    },
                    latency: telemetry.total_ms,
                    userId: user.id
                }
            }).catch(console.error)
        }

        return NextResponse.json(payload, { status: 200 })

    } catch (error) {
        console.error("API Error:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}