import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import crypto from 'crypto'
import { prisma } from '@/prisma'
import { hashApiKey } from '@/lib/hashApiKey'
import { revalidateTag } from 'next/cache' 

export async function POST(req: Request) {
  try {
    const session = await getServerSession()
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found in database" }, { status: 404 })
    }

    const oldKeys = await prisma.apiKey.findMany({
        where: { userId: user.id },
        select: { keyHash: true }
    })

    const rawKey = `${crypto.randomBytes(16).toString('hex')}`
    const hashedKey = hashApiKey(rawKey)

    await prisma.$transaction([
      prisma.apiKey.deleteMany({
        where: { userId: user.id }
      }),
      prisma.apiKey.create({
        data: {
          keyHash: hashedKey,
          userId: user.id,
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