'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, LayoutDashboard, ShieldAlert, Activity, ArrowRight, FileSpreadsheet } from "lucide-react"

export default function HeroSection() {
  return (
    <section className="relative w-full pt-32 pb-20 md:pt-40 md:pb-32 overflow-hidden">
      {/* Premium Background: Subtle grid + glow */}
      <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]">
        <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]" />
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-7xl">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-12">
          
          {/* Left: Text Content */}
          <div className="flex-1 text-center lg:text-left z-10">

            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60"
            >
              Real-Time Guardrails for {" "}
              <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-500">
                Bias & Safety
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed"
            >
              Protect your AI with <strong className="text-foreground font-semibold">real-time inline filtering</strong>, continuous self-healing, and bulk <strong className="text-foreground font-semibold">{" "}auditing</strong> for compliance reports.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button size="lg" className="w-full sm:w-auto gap-2 group h-12 px-8 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_25px_rgba(var(--primary),0.5)] transition-all">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Try Playground
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 h-12 px-8 bg-background/50 backdrop-blur-sm border-border hover:bg-muted/50">
                <LayoutDashboard className="w-4 h-4" />
                View Dashboard
              </Button>
            </motion.div>

            {/* Added Feature Callout for Data Auditing */}
            
          </div>

          {/* Right: Living Terminal Demo */}
          <motion.div 
            initial={{ opacity: 0, x: 20, rotate: 1 }}
            animate={{ opacity: 1, x: 0, rotate: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="flex-1 w-full max-w-lg lg:max-w-none relative perspective-1000"
          >
            {/* Ambient glow behind terminal */}
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary/30 to-indigo-500/30 blur-2xl opacity-50" />
            <LivingTerminal />
          </motion.div>
        </div>
      </div>
    </section>
  )
}

// --- The "Living" Terminal Component ---
function LivingTerminal() {
  const [step, setStep] = useState(0)

  // CORRECTED: Using setTimeout for dynamic delay intervals
  useEffect(() => {
    let delay = 500; // default fallback
    
    if (step === 0) delay = 1500;       // reading the prompt
    else if (step === 1) delay = 800;   // evaluating
    else if (step === 2) delay = 3500;  // holding on the result
    else if (step === 3) delay = 500;   // reset pause

    const timer = setTimeout(() => {
      setStep((prev) => (prev >= 3 ? 0 : prev + 1));
    }, delay);
    
    return () => clearTimeout(timer); // Cleanup on unmount or re-render
  }, [step]);

  return (
    <div className="relative rounded-xl border border-border/50 bg-[#0A0A0A] shadow-2xl overflow-hidden ring-1 ring-white/10">
      
      {/* Mac Window Header */}
      <div className="flex items-center px-4 py-3 bg-[#111111] border-b border-white/5">
        <div className="flex gap-2">
          <div className="w-3 h-3 rounded-full bg-[#ED6A5E]" />
          <div className="w-3 h-3 rounded-full bg-[#F5BF4F]" />
          <div className="w-3 h-3 rounded-full bg-[#61C554]" />
        </div>
        <div className="flex-1 text-center text-[11px] font-medium text-white/40 tracking-wider font-mono">
          bash — aegis-engine
        </div>
      </div>
      
      {/* Terminal Content */}
      <div className="p-6 font-mono text-[13px] leading-relaxed h-[240px] flex flex-col justify-center">
        
        {/* State 0 & 1: The Prompt */}
        <AnimatePresence>
          {step >= 0 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col gap-2 mb-6"
            >
              <div className="flex items-start gap-3">
                <ArrowRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="text-white/90">
                  "We prefer young candidates for this role to maintain our fast-paced culture."
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 1: Evaluating */}
        <AnimatePresence>
          {step === 1 && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-white/50 pl-7"
            >
              <Activity className="w-3 h-3 animate-spin" />
              <span>Analyzing semantics ...</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* State 2 & 3: The Result */}
        <AnimatePresence>
          {step >= 2 && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-3 pl-7 border-l-2 border-destructive/50 ml-[11px]"
            >
              <div className="flex items-center gap-3">
                <span className="px-2 py-0.5 rounded bg-destructive/20 text-destructive text-[11px] font-bold tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-3 h-3" />
                  INTERCEPTED
                </span>
                <span className="text-white/90 font-semibold">Age Discrimination</span>
              </div>
              
              {/* Removed hardcoded time claims. Added simple Status & Confidence */}
              <div className="grid grid-cols-2 gap-4 text-[11px] text-white/40 w-fit">
                <div className="flex flex-col">
                  <span className="uppercase tracking-wider mb-1 text-white/30">Confidence</span>
                  <span className="text-white/80 font-medium">94.2%</span>
                </div>
                <div className="flex flex-col">
                  <span className="uppercase tracking-wider mb-1 text-white/30">Processing</span>
                  <span className="text-emerald-500 font-medium">Real-Time</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}