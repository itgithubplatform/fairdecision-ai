// lib/getAuthUser.ts
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { verifyApiKey } from "@/lib/verifyApiKey"

export async function getAuthUser(req: Request) {
  const authHeader = req.headers.get('authorization')
  
  if (!authHeader) {
    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      return { id: session.user.id, email: session.user.email }
    }
    return null
  } else {
    const apiKeyResult = await verifyApiKey(req)
    if (apiKeyResult.success) {
      return { id: apiKeyResult.user.id, email: apiKeyResult.user.email }
    }
    return null
  }
}