import crypto from 'crypto'
import { prisma } from '@/prisma'
import { User } from '@prisma/client'
import { unstable_cache } from 'next/cache'

type AuthSuccess = {
  success: true;
  user: User;
  apiKeyId: string;
}

type AuthFailure = {
  success: false;
  error: string;
  status: number;
}

type AuthResult = AuthSuccess | AuthFailure

const getCachedApiKeyRecord = async (hash: string) => {
    return await unstable_cache(
        async () => {
            try {
                return await prisma.apiKey.findUnique({
                    where: { keyHash: hash },
                    include: { user: true }
                })
            } catch (error) {
                console.error("[DB ERROR] Failed to fetch API key:", error)
                return null
            }
        },
        [`apikey-${hash}`], 
        {
            tags: [`apikey-${hash}`],
            revalidate: 600 
        }
    )()
}

export async function verifyApiKey(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false, error: "Missing or invalid Authorization header", status: 401 }
  }

  const rawKey = authHeader.split(' ')[1]
  const incomingHash = crypto.createHash('sha256').update(rawKey).digest('hex')

  const validKeyRecord = await getCachedApiKeyRecord(incomingHash)

  if (!validKeyRecord) {
    return { success: false, error: "Invalid API Key", status: 401 }
  }

  if (!validKeyRecord.isActive) {
    return { success: false, error: "API Key has been revoked", status: 403 }
  }

  return { 
    success: true, 
    user: validKeyRecord.user,
    apiKeyId: validKeyRecord.id 
  }
}