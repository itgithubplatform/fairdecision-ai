import { NextAuthOptions } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import LinkedInProvider from 'next-auth/providers/linkedin'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '../prisma'

const DEFAULT_GUARDRAILS = [
    { text: "Gender or sex discrimination", category: "Bias & Fairness" },
    { text: "Age discrimination or graduation year filtering", category: "Age Bias" },
    { text: "Discrimination favoring young or recent graduates", category: "Age Bias" },
    { text: "Discrimination against family responsibilities or preference for young, single workers", category: "Bias & Fairness" },
    { text: "Geographic, regional, IP or location-based discrimination", category: "Location Bias" },
    { text: "Racial discrimination, name-based bias, or exclusionary culture fit", category: "Racial Bias" },
    { text: "Socioeconomic, income, or immigration status discrimination", category: "Socioeconomic Bias" },
    { text: "digital natives filtering", category: "Age Bias" }
]

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          prompt: "consent",
          access_type: "offline",
          response_type: "code"
        }
      }
    }),
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID!,
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: 'r_liteprofile r_emailaddress'
        }
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.uid = String(user.id)
      }
      if (account?.provider) {
        token.provider = account.provider
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.uid as string
        session.user.provider = token.provider as string
      }      
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
  },
  events:{
    createUser: async ({ user }) => {
      try {
        await prisma.customRule.createMany({
          data: DEFAULT_GUARDRAILS.map((rule) => ({
            userId: user.id,
            ruleText: rule.text,
            category: rule.category, 
            isSystem: true,         
            isActive: true,
          }))
        })
        console.log(`[SEED] Populated default guardrails for user: ${user.email}`)
      } catch (error) {
        console.error("[SEED ERROR] Failed to populate rules:", error)
      }
    },
  }
}