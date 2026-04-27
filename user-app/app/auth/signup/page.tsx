'use client'

import { useState } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { FcGoogle } from 'react-icons/fc'

export default function SignUpPage() {
  const [isLoading, setIsLoading] = useState<string | null>(null)
  const [error, setError] = useState('')
  const { data: session, status } = useSession()
  const router = useRouter()

  const handleSignUp = async (provider: 'google' | 'github') => {
    setIsLoading(provider)
    setError('')
    try {
      await signIn(provider, { callbackUrl: '/dashboard/playground' })
    } catch (error) {
      setError(`Failed to create account with ${provider === 'google' ? 'Google' : 'GitHub'}`)
      setIsLoading(null)
    }
  }

  if (status === "authenticated") {
    router.push('/dashboard')
    return null; 
  }

  return (
    <div className="min-h-screen bg-zinc-100 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      <div 
        className="absolute inset-0 z-0 opacity-[0.15]" 
        style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }}
      />
      <div className="max-w-[400px] w-full z-10">
        <Link 
          href="/"
          className="inline-flex items-center text-sm text-zinc-700 hover:text-zinc-900 mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to site
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-zinc-200 p-8"
        >
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-zinc-900 rounded-md flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-semibold tracking-tight text-zinc-900">Aegis AI</span>
            </div>
            <h1 className="text-2xl font-semibold text-zinc-900 tracking-tight mb-1">
              Create your account
            </h1>
            <p className="text-sm text-zinc-500">
              Deploy enterprise AI guardrails in minutes.
            </p>
          </div>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-md mb-6"
            >
              {error}
            </motion.div>
          )}
          <div className="space-y-3">
            <button
              onClick={() => handleSignUp('google')}
              disabled={!!isLoading}
              className="w-full flex items-center justify-center px-4 py-2.5 border border-zinc-200 rounded-lg hover:bg-zinc-50 hover:border-zinc-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isLoading === 'google' ? (
                <div className="w-5 h-5 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <FcGoogle className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                  <span className="text-sm font-medium text-zinc-700">Sign up with Google</span>
                </>
              )}
            </button>
          </div>
          <div className="mt-8 pt-6 border-t border-zinc-100">
            <div className="space-y-2.5">
              {
                [
                  "Real-time bias detection (<SubSec)",
                  "Enterprise compliance (EEOC & Fair Lending)",
                  "Self-improving AI via continuous auditing"
                ].map((e, i) =>
                  <div key={i} className="flex items-center text-xs text-gray-600">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-2 text-green-600" />
                    {e}
                  </div>)
              }
            </div>
          </div>
        </motion.div>
        <div className="mt-6 text-center space-y-2">
          <p className="text-sm text-zinc-600">
            Already have an account?{' '}
            <Link href="/auth/signin" className="font-medium text-zinc-900 hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-xs text-zinc-400">
            By signing up, you agree to our{' '}
            <a href="#" className="underline hover:text-zinc-600 transition-colors">Terms of Service</a> and{' '}
            <a href="#" className="underline hover:text-zinc-600 transition-colors">Privacy Policy</a>.
          </p>
        </div>

      </div>
    </div>
  )
}