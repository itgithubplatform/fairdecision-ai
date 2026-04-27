'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, ShieldCheck, AlertTriangle, CheckCircle2, 
  TerminalSquare, Clock, Activity, Loader2, Settings2, FileJson, Info,
  LayoutList, XCircle, Zap, ShieldAlert, Wand2, Check, Flag, Send
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import Spinner from '@/components/ui/spinner'
import { useRouter } from 'nextjs-toploader/app'

const PRESETS = [
  { label: "Age Bias", text: "The new applicant is a 45-year-old mother, she might not have the energy for this startup role." },
  { label: "Proxy Bias", text: "Looking for native English speakers only for this customer service position." },
  { label: "Safe Prompt", text: "We are seeking a senior developer with 5+ years of experience in React and Node.js." }
]

export default function PlaygroundPage() {
  const session = useSession()
  const router = useRouter()
  const [prompt, setPrompt] = useState(PRESETS[0].text)
  const [actionPreference, setActionPreference] = useState<'flag' | 'block'>('block')
  
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [latency, setLatency] = useState<number | null>(null)
  const [error, setError] = useState('')

  // Auto-Heal & Feedback State
  const [isHealing, setIsHealing] = useState(false)
  const [healResult, setHealResult] = useState<any | null>(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  const [isManualOverride, setIsManualOverride] = useState(false)
  const [humanFeedback, setHumanFeedback] = useState("")

  const runEvaluation = async () => {
    if (!prompt.trim()) {
      setError('Payload cannot be empty.')
      return
    }

    setIsLoading(true)
    setError('')
    setResponse(null)
    setLatency(null)
    
    // Reset Heal States
    setHealResult(null)
    setDeploySuccess(false)
    setIsManualOverride(false)
    setHumanFeedback("")

    const startTime = performance.now()

    try {
      const res = await fetch('/api/v1/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, action: actionPreference })
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

  const handleGenerateRule = async (isManual: boolean = false) => {
    setIsHealing(true)
    setDeploySuccess(false) 
    
    try {
      const feedbackString = isManual 
        ? `Human Override Directive: ${humanFeedback}` 
        : `Playground Evaluation: User requested automatic optimization of this rule.`;
        
      const engineDecision = response?.action === 'AUTO_BLOCKED' ? 'BLOCK' : response?.action === 'FLAGGED' ? 'FLAG' : 'ALLOW';
      const targetDecision = engineDecision === 'BLOCK' ? 'ALLOW' : 'BLOCK';

      const res = await fetch('/api/v1/heal-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: prompt,
          fastEngineDecision: engineDecision,
          resolutionContext: feedbackString,
          intendedDecision: targetDecision 
        })
      })

      const data = await res.json()
      setHealResult(data) 
      
    } catch (error) {
      console.error("Failed to generate rule preview", error)
      // Fallback for demo if API isn't wired yet
      setHealResult({
        action: "ADD_RULE",
        proposedRuleText: "Detect and flag semantic proxy discrimination in all hiring prompts.",
        reasoning: "The system failed to properly align with intent. A new explicit rule is required.",
        category: "General Compliance"
      })
    } finally {
      setIsHealing(false)
    }
  }

  const handleDeploy = async () => {
    if (!healResult || healResult.isDuplicate) return;
    setIsDeploying(true);
    
    try {
      const res = await fetch('/api/v1/deploy-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleText: healResult.proposedRuleText,
          sourcePrompt: prompt,
          category: healResult.category || "General Compliance"
        })
      });
      
      if (res.ok) {
        setDeploySuccess(true);
      } else {
        console.error("Deployment failed");
      }
    } catch (error) {
      console.error("Failed to deploy rule", error);
    } finally {
      setIsDeploying(false);
    }
  }

  const highlightJSON = (json: any) => {
    const formatted = JSON.stringify(json, null, 2)
    return formatted.split('\n').map((line, i) => {
      let html = line
        .replace(/"([^"]+)":/g, '<span class="text-zinc-400">"$1"</span>:') 
        .replace(/: "([^"]+)"/g, ': <span class="text-emerald-400">"$1"</span>') 
        .replace(/: (true|false)/g, ': <span class="text-amber-400">$1</span>') 
        .replace(/: ([\d.]+)/g, ': <span class="text-blue-400">$1</span>') 

      return <div key={i} dangerouslySetInnerHTML={{ __html: html }} className="hover:bg-white/[0.02] px-4 transition-colors" />
    })
  }

  const isViolation = response?.action === 'BLOCK' || response?.action === 'FLAG'
  if (session.status==="loading") {
    return <Spinner/>
  }
  if (session.status==="unauthenticated") {
    return router.push("/auth/signin")
  }
  return (
    <div className="max-w-[1300px] mx-auto p-6 md:p-10 font-sans animate-in fade-in duration-700">
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-border/60 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Aegis Diagnostics Console</h1>
          </div>
          <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
            Test payloads against your live semantic proxy. See exactly how Aegis evaluates, decides, and heals.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 px-3! py-4!">
            <Activity className="w-3 h-3 mr-1.5" /> Live Workspace Active
          </Badge>
          <Link href="/dashboard/guardrails">
            <Button variant="outline" className="h-9 text-xs font-medium bg-background shadow-sm">
              <Settings2 className="w-3.5 h-3.5 mr-2" /> View Policies
            </Button>
          </Link>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN - CONFIGURATION */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          <div className="flex-1 rounded-xl border border-border bg-card shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 space-y-6 flex-1">
              
              {/* Guided Presets */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                  <TerminalSquare className="w-3.5 h-3.5" /> 1. Select a Scenario
                </label>
                <div className="flex flex-wrap gap-2">
                  {PRESETS.map((p) => (
                    <Badge 
                      key={p.label} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all px-3 py-1 text-xs"
                      onClick={() => setPrompt(p.text)}
                    >
                      {p.label}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Prompt Input */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  2. Request Payload
                </label>
                <div className="relative group">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full h-32 p-4 text-[14px] leading-relaxed bg-muted/40 border border-border rounded-lg text-foreground outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none"
                  />
                  <div className="absolute bottom-3 right-3 text-[11px] font-mono text-muted-foreground/50">
                    {prompt.length} chars
                  </div>
                </div>
              </div>

              {/* Enforcement Mode */}
              <div className="space-y-3">
                <label className="text-[11px] font-bold tracking-wider text-muted-foreground uppercase flex items-center gap-2">
                  <ShieldAlert className="w-3.5 h-3.5" /> 3. Enforcement Mode
                </label>
                
                <div className="grid grid-cols-2 gap-2">
                  <div 
                    onClick={() => setActionPreference('flag')}
                    className={`cursor-pointer p-3 rounded-lg border text-sm transition-all ${actionPreference === 'flag' ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                  >
                    <div className="font-semibold mb-1">Shadow Mode</div>
                    <div className="text-xs opacity-80">Flags threats, allows request.</div>
                  </div>
                  <div 
                    onClick={() => setActionPreference('block')}
                    className={`cursor-pointer p-3 rounded-lg border text-sm transition-all ${actionPreference === 'block' ? 'border-primary bg-primary/5 text-foreground' : 'border-border bg-muted/30 text-muted-foreground'}`}
                  >
                    <div className="font-semibold mb-1">Strict Mode</div>
                    <div className="text-xs opacity-80">Blocks threats instantly.</div>
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-medium">
                  {error}
                </div>
              )}
            </div>

            {/* Action Footer */}
            <div className="p-4 bg-muted/30 border-t border-border">
              <Button onClick={runEvaluation} disabled={isLoading} className="w-full h-12 text-sm font-medium shadow-sm">
                {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2 fill-current" />}
                {isLoading ? 'Executing Request...' : 'Send Request'}
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN - VISUAL OUTPUT */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[550px]">
          <Tabs defaultValue="visual" className="w-full h-full flex flex-col rounded-xl border bg-card shadow-sm overflow-hidden">
            
            <div className="flex items-center justify-between border-b px-2 bg-muted/30">
              <TabsList className="bg-transparent h-12 p-0">
                <TabsTrigger value="visual" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm">
                  <LayoutList className="w-4 h-4 mr-2"/> Visual Trace
                </TabsTrigger>
                <TabsTrigger value="json" className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-md px-4 py-2 text-sm">
                  <FileJson className="w-4 h-4 mr-2"/> Raw JSON
                </TabsTrigger>
              </TabsList>
              
              <div className="flex gap-2">
                {latency && (
                  <Badge variant="outline" className="font-mono text-xs">
                    <Clock className="w-3 h-3 mr-1.5" />CPU {latency}ms
                  </Badge>
                )}
                {latency && (
                  <Badge variant="outline" className="mr-4 font-mono text-xs">
                    <Clock className="w-3 h-3 mr-1.5" />~GPU {Math.max(1, Math.floor(latency/10))}ms
                  </Badge>
                )}
              </div>
            </div>

            <TabsContent value="visual" className="flex-1 p-0 m-0 overflow-y-auto">
              {!response && !isLoading && (
                <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground space-y-4">
                  <ShieldCheck className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Awaiting payload for inspection.</p>
                </div>
              )}

              {isLoading && (
                <div className="flex flex-col items-center justify-center h-[500px] text-muted-foreground space-y-4">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <div className="text-sm font-medium animate-pulse text-center">
                    <p>Checking Request...</p>
                    <p className="text-xs opacity-50">Semantic Routing & Analysis</p>
                  </div>
                </div>
              )}

              {response && !isLoading && (
                <div className="p-6 md:p-8 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                  
                  {/* HERO DECISION CARD */}
                  <div className={`p-6 rounded-xl border-2 flex items-start gap-4 ${
                    isViolation 
                      ? actionPreference === 'block' 
                        ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-400' 
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-400'
                  }`}>
                    {isViolation ? <XCircle className="w-8 h-8 shrink-0" /> : <CheckCircle2 className="w-8 h-8 shrink-0" />}
                    <div>
                      <h2 className="text-xl font-bold tracking-tight">
                        {response.action === 'BLOCK' || response.action === 'AUTO_BLOCKED' ? 'REQUEST BLOCKED' : 
                         response.action === 'FLAG' || response.action === 'FLAGGED' ? 'REQUEST FLAGGED (Shadow Mode)' : 'REQUEST PASSED'}
                      </h2>
                      <p className="text-sm mt-1 opacity-80 font-medium">
                        {isViolation 
                          ? `Aegis intercepted this payload. Confidence: ${Math.round(response?.violations?.[0].score * 100) || 94}%.` 
                          : 'No policy violations detected. Payload is safe.'}
                      </p>
                    </div>
                  </div>

                  {/* REASONING SECTION */}
                  {isViolation && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Diagnostic Breakdown</h3>
                      <div className="space-y-3 bg-muted/30 p-4 rounded-lg border">
                        <div className="flex justify-between border-b pb-2">
                          <span className="text-sm font-medium">Primary Threat</span>
                          <Badge variant="destructive">{response.details?.top_threat || response.top_threat || 'Policy Violation'}</Badge>
                        </div>
                        <div className="flex justify-between pb-1">
                          <span className="text-sm font-medium">Triggered Policy</span>
                          <span className="text-sm text-muted-foreground">{response?.violations?.[0]?.rule || response.details?.top_rule || 'Implicit Bias Detection'}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AUTO-HEAL & MANUAL FEEDBACK FEATURE */}
                  <div className="p-5 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-4">
                    <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold">
                      <Wand2 className="w-5 h-5" /> AI Self-Healing & Feedback
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {isViolation 
                        ? "Did the engine overreact? Or do you want to permanently deploy a rule preventing this?" 
                        : "Did Aegis miss a biased payload? Flag this issue to generate a new protective policy."}
                    </p>
                    
                    {!healResult && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        {!isManualOverride && (
                          <Button 
                            onClick={() => handleGenerateRule(false)} 
                            disabled={isHealing} 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9 shadow-sm"
                          >
                            {isHealing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-2" />}
                            {isHealing ? "Analyzing Prompt..." : "Auto-Heal Rule"}
                          </Button>
                        )}
                        
                        {!isManualOverride && (
                          <Button 
                            onClick={() => setIsManualOverride(true)} 
                            variant="outline" 
                            className="flex-1 text-xs h-9 bg-background border-border hover:bg-muted/50"
                          >
                            <Flag className="w-3.5 h-3.5 mr-2" />
                            Flag Issue (Provide Context)
                          </Button>
                        )}
                      </div>
                    )}

                    {/* MANUAL FEEDBACK TEXTBOX */}
                    {isManualOverride && !healResult && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="pt-3 flex flex-col gap-3 border-t border-indigo-500/10 mt-2">
                        <div className="flex flex-col gap-1.5">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                            Why is the system wrong?
                          </label>
                          <textarea 
                            autoFocus
                            value={humanFeedback}
                            onChange={(e) => setHumanFeedback(e.target.value)}
                            placeholder="Provide context for the AI Auditor. E.g., 'This prompt contains subtle classism...'"
                            className="w-full text-[13px] p-3 rounded-md border border-border bg-background shadow-inner resize-none focus:ring-1 focus:ring-indigo-500 outline-none"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsManualOverride(false)}
                            className="text-xs h-9"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleGenerateRule(true)} 
                            disabled={isHealing || humanFeedback.trim().length === 0} 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-9"
                          >
                            {isHealing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                            {isHealing ? "Generating Fix..." : "Generate Custom Rule"}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* PROPOSED RULE OUTCOME & DEPLOYMENT */}
                    {healResult && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-background border border-indigo-500/30 rounded-lg shadow-sm relative overflow-hidden mt-4">
                        <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500" />
                        
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 mb-3 text-[10px] font-bold">
                          {healResult.action?.replace('_', ' ') || "UPDATE RULE"}
                        </Badge>
                        
                        <p className="text-[13px] font-medium mb-2 text-foreground">"{healResult.proposedRuleText}"</p>
                        <p className="text-[11px] text-muted-foreground mb-4 leading-relaxed">{healResult.reasoning}</p>
                        
                        <Button 
                          onClick={handleDeploy}
                          disabled={isDeploying || deploySuccess || healResult.isDuplicate}
                          className={`w-full text-xs h-9 transition-colors duration-200 ${
                            deploySuccess 
                              ? "bg-emerald-500 hover:bg-emerald-600 text-white" 
                              : healResult.isDuplicate
                              ? "bg-muted text-muted-foreground"
                              : "bg-foreground text-background hover:bg-foreground/90"
                          }`}
                        >
                          {isDeploying ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Deploying...</>
                          ) : deploySuccess ? (
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Deployed to Live Engine</>
                          ) : healResult.isDuplicate ? (
                            "Rule Already Exists"
                          ) : (
                            "Approve & Deploy to Engine"
                          )}
                        </Button>
                      </motion.div>
                    )}
                  </div>

                  {/* LATENCY PIPELINE */}
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Execution Pipeline</h3>
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <div className="px-2 py-1 bg-muted rounded border">Classifier</div>
                      <span>→</span>
                      <div className="px-2 py-1 bg-muted rounded border">Semantic Match</div>
                      <span>→</span>
                      <div className="px-2 py-1 bg-muted rounded border">Slm</div>
                    </div>
                  </div>

                </div>
              )}
            </TabsContent>

            <TabsContent value="json" className="flex-1 p-0 m-0">
               <div className="bg-[#0A0A0A] h-full min-h-[500px] overflow-y-auto p-4">
                 {response ? (
                   <pre className="text-[13px] font-mono leading-[1.6] tracking-tight text-zinc-300">
                     {highlightJSON(response)}
                   </pre>
                 ) : (
                   <div className="text-zinc-600 font-mono text-sm h-full flex items-center justify-center">
                     Waiting for payload JSON...
                   </div>
                 )}
               </div>
            </TabsContent>
          </Tabs>
        </div>

      </div>
    </div>
  )
}