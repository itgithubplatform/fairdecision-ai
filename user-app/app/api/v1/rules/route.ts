import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { getAuthUser } from '@/lib/getAuthUser'
import { revalidateTag } from 'next/cache'

export async function GET(req: Request) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const rules = await prisma.customRule.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(rules, { status: 200 })
  } catch (error) {
    console.error("GET Rules Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    if (!body.ruleText || typeof body.ruleText !== 'string') {
      return NextResponse.json({ error: "Invalid ruleText provided" }, { status: 400 })
    }

    const newRule = await prisma.customRule.create({
      data: {
        ruleText: body.ruleText.trim(),
        userId: user.id,
        isActive: true
      }
    })

    revalidateTag(`userRule-${user.id}`)

    return NextResponse.json(newRule, { status: 201 })
  } catch (error) {
    console.error("POST Rules Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}