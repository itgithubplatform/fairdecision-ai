import { NextResponse } from 'next/server'
import { prisma } from '@/prisma'
import { getAuthUser } from '@/lib/getAuthUser'
import { revalidateTag } from 'next/cache'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ruleId = params.id

    const existingRule = await prisma.customRule.findUnique({ where: { id: ruleId, userId: user.id } })
    if (!existingRule) {
      return NextResponse.json({ error: "Rule not found or access denied" }, { status: 404 })
    }

    const updatedRule = await prisma.customRule.update({
      where: { id: ruleId, userId: user.id },
      data: { isActive: !existingRule.isActive }
    })

    revalidateTag(`userRule-${user.id}`)

    return NextResponse.json(updatedRule, { status: 200 })
  } catch (error) {
    console.error("PATCH Rule Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthUser(req)
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const ruleId = params.id

    const existingRule = await prisma.customRule.findUnique({ where: { id: ruleId } })
    if (!existingRule || existingRule.userId !== user.id) {
      return NextResponse.json({ error: "Rule not found or access denied" }, { status: 404 })
    }

    await prisma.customRule.delete({
      where: { id: ruleId, userId: user.id }
    })

    revalidateTag(`userRule-${user.id}`)

    return NextResponse.json({ success: true, message: "Rule deleted" }, { status: 200 })
  } catch (error) {
    console.error("DELETE Rule Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}