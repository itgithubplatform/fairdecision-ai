'use client'

import { motion } from "framer-motion"
import { ArrowRight, ShieldCheck, RefreshCcw, Database, Zap, Sparkles } from "lucide-react"

export default function SolutionSection() {
  return (
    <section className="py-24 md:py-32 bg-background border-y border-border/40 relative overflow-hidden z-0">
      
      {/* --- Premium Background Elements: Grid + Corner Blurs --- */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        {/* Fading Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        {/* Middle Left Corner Blur */}
        <div className="absolute top-1/4 -left-40 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[120px] opacity-50" />
      </div>

      <div className="container mx-auto px-6 max-w-6xl relative z-10">
        
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20 flex flex-col items-center"
        >
          {/* Brand-aligned Pill */}

          <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            Protection without the bottleneck.
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed">
            Aegis splits the workload. A lightning-fast inline proxy intercepts threats in real-time, while an asynchronous AI auditor continuously refines your safety rules in the background.
          </p>
        </motion.div>

        {/* --- VISUAL FLOWCHART --- */}
        <div className="max-w-4xl mx-auto relative">
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
            
            {/* Step 1: Input */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="w-full md:w-[220px] p-5 rounded-2xl border border-border bg-card shadow-sm text-center z-10"
            >
              <div className="text-sm font-semibold text-foreground mb-1">User Application</div>
              <div className="text-xs text-muted-foreground">Raw LLM Prompt</div>
            </motion.div>

            {/* Arrow */}
            <motion.div 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              className="hidden md:flex flex-1 items-center justify-center relative"
            >
              <div className="h-[2px] w-full bg-border absolute top-1/2 -translate-y-1/2 z-0" />
              <ArrowRight className="w-5 h-5 text-muted-foreground relative z-10 bg-background px-1" />
            </motion.div>
            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:hidden my-2" />

            {/* Step 2: Aegis Core (The Shield) */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="w-full md:w-[280px] p-6 rounded-2xl border-2 border-primary/50 bg-card shadow-[0_0_30px_rgba(var(--primary),0.1)] text-center relative z-10"
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 text-primary">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div className="text-base font-bold text-foreground mb-1">Aegis Inline Proxy</div>
              <div className="text-xs font-medium text-emerald-500 bg-emerald-500/10 inline-flex px-2 py-0.5 rounded uppercase tracking-wider border border-emerald-500/20">
                Real-Time Filtering
              </div>
            </motion.div>

            {/* Arrow */}
            <motion.div 
              initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.4 }}
              className="hidden md:flex flex-1 items-center justify-center relative"
            >
              <div className="h-[2px] w-full bg-border absolute top-1/2 -translate-y-1/2 z-0" />
              <ArrowRight className="w-5 h-5 text-muted-foreground relative z-10 bg-background px-1" />
            </motion.div>
            <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90 md:hidden my-2" />

            {/* Step 3: Output */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.5 }}
              className="w-full md:w-[220px] p-5 rounded-2xl border border-border bg-card shadow-sm text-center z-10"
            >
              <div className="text-sm font-semibold text-foreground mb-1">Production LLM</div>
              <div className="text-xs text-muted-foreground">Safe, Compliant Request</div>
            </motion.div>

          </div>

          {/* Step 4: The Async Audit Loop */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.7 }}
            className="mt-8 md:mt-12 flex flex-col items-center"
          >
            {/* Dashed connector line */}
            <div className="h-8 md:h-12 w-[2px] border-l-2 border-dashed border-primary/30 mb-2" />
            
            <div className="w-full md:w-[400px] p-5 rounded-2xl border border-primary/20 bg-primary/5 text-center relative overflow-hidden group backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]" />
              <div className="flex items-center justify-center gap-2 mb-2 text-primary">
                <RefreshCcw className="w-4 h-4" />
                <span className="text-sm font-bold uppercase tracking-wider">Asynchronous AI Auditor</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Background worker audits traffic logs, detects false positives, and generates auto-healing rule updates.
              </p>
            </div>
          </motion.div>
        </div>

        {/* --- EXPLANATION CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            {
              icon: Zap,
              title: "Inline Speed",
              desc: "Optimized semantic routing ensures your firewall never bottlenecks your user experience."
            },
            {
              icon: Sparkles,
              title: "Deep Auditing",
              desc: "A massive, secondary AI model reviews logs in the background to catch nuanced bypasses the inline proxy missed."
            },
            {
              icon: RefreshCcw,
              title: "Self-Healing Rules",
              desc: "When the auditor detects a mistake, it proposes a newly generated rule to prevent it from ever happening again."
            }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 + (i * 0.1) }}
              className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{item.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}