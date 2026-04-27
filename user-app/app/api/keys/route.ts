import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import crypto from 'crypto'
import { prisma } from '@/prisma'
import { hashApiKey } from '@/lib/hashApiKey'
import { revalidateTag } from 'next/cache' 
import { authOptions } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const oldKeys = await prisma.apiKey.findMany({
        where: { userId: session.user.id },
        select: { keyHash: true }
    })

    const rawKey = `${crypto.randomBytes(16).toString('hex')}`
    const hashedKey = hashApiKey(rawKey)

    await prisma.$transaction([
      prisma.apiKey.deleteMany({
        where: { userId: session.user.id }
      }),
      prisma.apiKey.create({
        data: {
          keyHash: hashedKey,
          userId: session.user.id,
          isActive: true
        }
      })
    ])

    oldKeys.forEach(key => {
        revalidateTag(`apikey-${key.keyHash}`)
    })

    return NextResponse.json({ apiKey: rawKey }, { status: 200 })

  } catch (error) {
    console.error("API Key Generation Error:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const apiKeys = await prisma.apiKey.findMany({
    where: { userId: session.user.id }
  })

  return NextResponse.json({ apiKeys }, { status: 200 })
}
