'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Terminal, CheckCircle2, Copy, ShieldAlert, FileText, AlertOctagon, Clock, Fingerprint } from "lucide-react"

export default function LiveProofSection() {
  const [copied, setCopied] = useState(false)
  const [activeTab, setActiveTab] = useState<'code' | 'result'>('code')

  const handleCopy = () => {
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <section className="py-24 md:py-32 bg-background border-t border-border/30 relative overflow-hidden">
      
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-primary/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 max-w-5xl relative z-10">
        
        <div className="text-center mb-16 lg:mb-20">          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6"
          >
            One API call. <br className="hidden sm:block" />
            <span className="text-primary">Zero proxy discrimination.</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Standard keyword filters fail against subtle biases. Aegis understands context, catching nuanced violations like "digital natives" without blocking legitimate traffic.
          </motion.p>
        </div>

        {/* Premium IDE / Visualizer Block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="max-w-4xl mx-auto rounded-2xl border border-border/50 bg-[#0A0A0A] shadow-2xl overflow-hidden ring-1 ring-white/10"
        >
          {/* Header & Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between px-2 sm:px-4 py-2 bg-[#111111] border-b border-white/5 gap-4 sm:gap-0">
            <div className="flex items-center gap-4 px-2 sm:px-0">
              <div className="flex gap-2">
                <div className="w-3 h-3 rounded-full bg-[#ED6A5E]" />
                <div className="w-3 h-3 rounded-full bg-[#F5BF4F]" />
                <div className="w-3 h-3 rounded-full bg-[#61C554]" />
              </div>
              
              {/* Custom Tabs */}
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg ml-2">
                <button 
                  onClick={() => setActiveTab('code')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${activeTab === 'code' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/80'}`}
                >
                  route.ts
                </button>
                <button 
                  onClick={() => setActiveTab('result')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all flex items-center gap-1.5 ${activeTab === 'result' ? 'bg-destructive/10 text-destructive' : 'text-white/50 hover:text-white/80'}`}
                >
                  <ShieldAlert className="w-3 h-3" />
                  Security Event Log
                </button>
              </div>
            </div>
            
            {activeTab === 'code' && (
              <button 
                onClick={handleCopy}
                className="text-white/40 hover:text-white transition-colors flex items-center justify-center gap-2 text-xs font-mono bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-md mx-2 sm:mx-0"
              >
                {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy Code'}
              </button>
            )}
          </div>
          
          {/* Content Area */}
          <div className="relative min-h-[320px]">
            <AnimatePresence mode="wait">
              
              {/* TAB: CODE (API Fetch View) */}
              {activeTab === 'code' && (
                <motion.div 
                  key="code"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="p-6 md:p-8 font-mono text-[13px] md:text-[14px] leading-loose overflow-x-auto"
                >
                  <pre className="text-white/80">
                    <span className="text-[#C678DD]">const</span> response = <span className="text-[#C678DD]">await</span> fetch(<span className="text-[#98C379]">{`\`\${process.env.NEXTAUTH_URL}/api/v1/evaluate\``}</span>, {'{\n'}
                    {'  '}method: <span className="text-[#98C379]">"POST"</span>,{"\n"}
                    {'  '}headers: {'{'} <span className="text-[#98C379]">"Content-Type"</span>: <span className="text-[#98C379]">"application/json"</span> {'}'},{"\n"}
                    {'  '}body: <span className="text-[#E5C07B]">JSON</span>.stringify({'{\n'}
                    {'    '}<span className="text-[#E06C75]">prompt</span>: <span className="text-[#98C379]">"Looking for energetic digital natives to join our fast-paced startup."</span>{"\n"}
                    {'  }'}){"\n"}
                    {'}'});{"\n\n"}
                    <span className="text-[#C678DD]">const</span> evaluation = <span className="text-[#C678DD]">await</span> response.json();{"\n\n"}
                    <span className="text-[#5C6370] italic">{"// Aegis intercepts the proxy discrimination"}</span>{"\n"}
                    <span className="text-[#C678DD]">if</span> (evaluation.decision === <span className="text-[#98C379]">"BLOCK"</span>) {'{\n'}
                    {'  '}<span className="text-[#56B6C2]">console</span>.warn(<span className="text-[#98C379]">\`Blocked: \${"{"}evaluation.reason{"}"}\`</span>);{"\n"}
                    {'  '}<span className="text-[#C678DD]">return</span> <span className="text-[#C678DD]">new</span> Response(<span className="text-[#98C379]">"Policy violation detected."</span>, {'{'} status: <span className="text-[#D19A66]">403</span> {'}'});{"\n"}
                    {'}'}
                  </pre>
                </motion.div>
              )}

              {/* TAB: RESULT (Security Event Log Widget) */}
              {activeTab === 'result' && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
                  className="p-6 md:p-8 flex items-center justify-center h-full min-h-[320px] bg-[#050505]"
                >
                  <div className="w-full max-w-lg bg-[#111111] border border-white/10 rounded-xl overflow-hidden shadow-2xl relative">
                    
                    {/* Top Threat Indicator Line */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-destructive to-transparent" />
                    
                    {/* Header */}
                    <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertOctagon className="w-4 h-4 text-destructive" />
                        <span className="text-white font-semibold text-sm">Action Blocked</span>
                      </div>
                      <span className="text-[10px] font-mono text-white/40 bg-white/5 px-2 py-1 rounded">req_89A2BF90X</span>
                    </div>

                    {/* Content */}
                    <div className="p-5 space-y-5">
                      
                      {/* The Evaluated Prompt */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-white/40 mb-2 font-semibold">Evaluated Payload</div>
                        <div className="text-white/80 text-[13px] leading-relaxed bg-[#0A0A0A] p-3 rounded-lg border border-white/5 font-mono">
                          "Looking for energetic <span className="text-destructive font-semibold border-b border-destructive/50 pb-0.5">digital natives</span> to join our fast-paced startup."
                        </div>
                      </div>

                      {/* Metadata Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-[#0A0A0A] p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-wider">
                            <Fingerprint className="w-3 h-3" /> Rule Triggered
                          </div>
                          <div className="text-white/90 text-sm font-medium">Age Discrimination</div>
                        </div>
                        
                        <div className="bg-[#0A0A0A] p-3 rounded-lg border border-white/5 flex flex-col gap-1">
                          <div className="flex items-center gap-1.5 text-white/40 text-[10px] uppercase tracking-wider">
                            <Clock className="w-3 h-3" /> Confidence
                          </div>
                          <div className="text-destructive text-sm font-bold font-mono">98.2% Match</div>
                        </div>
                      </div>

                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </motion.div>

      </div>
    </section>
  )
}