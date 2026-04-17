'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, ShieldCheck, AlertTriangle, CheckCircle2, 
  TerminalSquare, Clock, Activity, Loader2, Settings2, FileJson, Info
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState('The new applicant is a 45-year-old mother, she might not have the energy for this startup role.')
  const [actionPreference, setActionPreference] = useState<'flag' | 'block'>('flag')
  
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState('')

  const runEvaluation = async () => {
    if (!prompt.trim()) {
      setError('Payload cannot be empty.')
      return
    }

    setIsLoading(true)
    setError('')
    setResponse(null)
    setLatency(null)

    const startTime = performance.now()

    try {
      const res = await fetch('/api/v1/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt, 
          action: actionPreference 
        })
      })

      const endTime = performance.now()
      setLatency(Math.round(endTime - startTime))

      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Evaluation failed')
      setResponse(data.data || data) 

    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Enterprise-grade simple JSON syntax highlighter
  const highlightJSON = (json: any) => {
    const formatted = JSON.stringify(json, null, 2)
    return formatted.split('\n').map((line, i) => {
      let html = line
        .replace(/"([^"]+)":/g, '<span class="text-zinc-400">"$1"</span>:') // Keys
        .replace(/: "([^"]+)"/g, ': <span class="text-emerald-400">"$1"</span>') // Strings
        .replace(/: (true|false)/g, ': <span class="text-amber-400">$1</span>') // Booleans
        .replace(/: ([\d.]+)/g, ': <span class="text-blue-400">$1</span>') // Numbers

      return <div key={i} dangerouslySetInnerHTML={{ __html: html }} className="hover:bg-white/[0.02] px-4 transition-colors" />
    })
  }

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-10 font-sans animate-in fade-in duration-700">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-border/60">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">API Simulator</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Send test payloads to the Aegis engine. Responses are evaluated against the live compliance guardrails configured in your workspace.
          </p>
        </div>
        
        <Link href="/dashboard/guardrails">
          <Button variant="outline" className="h-9 text-xs font-medium tracking-wide bg-background shadow-sm hover:bg-accent hover:text-accent-foreground transition-all">
            <Settings2 className="w-3.5 h-3.5 mr-2" />
            Configure Guardrails
          </Button>
        </Link>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN - CONFIGURATION */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* Status Alert */}
          <div className="flex items-start gap-3 p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-blue-700 dark:text-blue-400">
            <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Live Database Connection Active</h4>
              <p className="text-xs opacity-80 leading-relaxed">
                Evaluating against your production workspace rules. No data is stored during simulation.
              </p>
            </div>
          </div>

          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 space-y-6 flex-1">
              
              {/* Prompt Input */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <TerminalSquare className="w-4 h-4" />
                  Request Payload
                </label>
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder="Enter prompt text to analyze..."
                    className="w-full h-40 p-4 text-[14px] leading-relaxed bg-muted/40 border border-border rounded-lg text-foreground transition-all duration-200 outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none placeholder:text-muted-foreground/50"
                  />
                  <div className="absolute bottom-3 right-3 text-[11px] font-mono text-muted-foreground/50">
                    {prompt.length} chars
                  </div>
                </div>
              </div>

              {/* Segmented Control (Flag vs Block) */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[13px] font-semibold tracking-wide text-muted-foreground uppercase">
                  <AlertTriangle className="w-4 h-4" />
                  Enforcement Mode
                </label>
                
                <div className="relative flex p-1 bg-muted/50 border border-border rounded-lg">
                  {['flag', 'block'].map((mode) => {
                    const isActive = actionPreference === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => setActionPreference(mode as 'flag' | 'block')}
                        className={`relative w-full py-2.5 text-[13px] font-medium transition-colors z-10 capitalize ${
                          isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                        }`}
                      >
                        {isActive && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute inset-0 bg-background border border-border rounded-md shadow-sm"
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            style={{ zIndex: -1 }}
                          />
                        )}
                        {mode === 'flag' ? 'Shadow Mode (Flag)' : 'Strict Mode (Block)'}
                      </button>
                    )
                  })}
                </div>
                <p className="text-[12px] text-muted-foreground flex items-center gap-1.5 px-1">
                  <Info className="w-3.5 h-3.5" />
                  {actionPreference === 'flag' ? 'Flags violations without blocking the request.' : 'Immediately blocks violating requests.'}
                </p>
              </div>

              {error && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-medium">
                  {error}
                </motion.div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-muted/30 border-t border-border">
              <Button 
                onClick={runEvaluation} 
                disabled={isLoading} 
                className="w-full h-11 text-sm font-medium shadow-sm relative overflow-hidden group"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Play className="w-4 h-4 mr-2 fill-current opacity-80 group-hover:opacity-100 transition-opacity" />
                )}
                {isLoading ? 'Executing Request...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - JSON TERMINAL */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[550px]">
          <div className="rounded-xl border border-zinc-800 bg-[#0A0A0A] shadow-2xl overflow-hidden flex flex-col flex-1 ring-1 ring-white/5 relative">
            
            {/* Window Chrome */}
            <div className="flex items-center justify-between px-4 py-3 bg-[#111111] border-b border-zinc-800/80 select-none">
              <div className="flex items-center gap-4">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-700/50" />
                </div>
                <div className="flex items-center gap-2 text-zinc-500 text-[12px] font-mono tracking-wide">
                  <FileJson className="w-3.5 h-3.5" />
                  RESPONSE.JSON
                </div>
              </div>

              {latency !== null && !isLoading && (
                <AnimatePresence>
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`flex items-center text-[11px] font-mono px-2.5 py-1 rounded-md border ${
                      latency < 100 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : latency < 300 
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                          : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}
                  >
                    <Clock className="w-3 h-3 mr-1.5" />
                    {latency}ms
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
            
            {/* Terminal Body */}
            <div className="flex-1 overflow-y-auto relative py-4">
              {!response && !isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-600 space-y-4">
                  <TerminalSquare className="w-10 h-10 opacity-20 stroke-[1]" />
                  <p className="text-[13px] font-mono tracking-tight">System idle. Awaiting POST request.</p>
                </div>
              )}

              {isLoading && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-500 space-y-4">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <p className="text-[13px] font-mono tracking-tight animate-pulse text-zinc-400">Processing via Aegis Engine...</p>
                </div>
              )}

              {response && !isLoading && (
                <AnimatePresence mode="popLayout">
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                  >
                    {/* Visual Status Banner */}
                    <div className="px-4 pb-4 mb-4 border-b border-zinc-800/50">
                      <div className="flex items-center gap-2.5">
                        {response.action?.includes('PASSED') ? (
                          <div className="p-1 bg-emerald-500/10 rounded">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          </div>
                        ) : (
                          <div className={`p-1 rounded ${response.action?.includes('FLAGGED') ? 'bg-amber-500/10' : 'bg-red-500/10'}`}>
                            <AlertTriangle className={`w-4 h-4 ${response.action?.includes('FLAGGED') ? 'text-amber-500' : 'text-red-500'}`} />
                          </div>
                        )}
                        <span className="text-[11px] font-mono font-medium text-zinc-300 tracking-wider">
                          HTTP 200 OK — ENGINE STATUS
                        </span>
                      </div>
                    </div>

                    {/* Syntax Highlighted JSON */}
                    <pre className="text-[13px] font-mono leading-[1.6] tracking-tight text-zinc-300">
                      {highlightJSON(response)}
                    </pre>
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
            
          </div>
        </div>

      </div>
    </div>
  )
}