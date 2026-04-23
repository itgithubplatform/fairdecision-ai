'use client'

import { motion } from "framer-motion"
import { ShieldAlert, FileSpreadsheet, Wand2, RefreshCcw, Activity, Scale } from "lucide-react"

const features = [
  { 
    icon: ShieldAlert, 
    title: "Inline Semantic Firewall", 
    desc: "Sub-second routing intercepts bias, toxicity, and PII leaks before they reach your production LLM. No more regex-based keyword blocking." 
  },
  { 
    icon: FileSpreadsheet, 
    title: "Batch Data Auditing", 
    desc: "Don't just protect real-time traffic. Upload CSVs or documents to instantly scan historical data and generate comprehensive compliance reports." 
  },
  { 
    icon: RefreshCcw, 
    title: "Self-Healing Engine", 
    desc: "An asynchronous background auditor reviews traffic logs, catches false positives, and auto-generates rule updates to fix edge cases." 
  },
  { 
    icon: Wand2, 
    title: "Natural Language Policies", 
    desc: "Define your safety boundaries in plain English. The AI Rule Generator translates your business logic into strict, enforceable semantic rules." 
  },
  { 
    icon: Activity, 
    title: "Human-in-the-Loop Dashboard", 
    desc: "Review flagged prompts, monitor system latency, evaluate the AI auditor's reasoning, and deploy new rules to the engine with a single click." 
  },
  { 
    icon: Scale, 
    title: "Enterprise Compliance", 
    desc: "Purpose-built to mitigate EEOC (Employment) and Fair Lending risks. Ship AI applications that adhere to strict legal and ethical frameworks." 
  }
]

export default function FeaturesSection() {
  return (
    <section className="relative py-24 md:py-32 bg-muted/10 border-y border-border/40 overflow-hidden">
      
      <div className="container mx-auto px-6 max-w-7xl relative z-10">
        
        {/* Header Block */}
        <div className="mb-20 md:text-center flex flex-col items-center">          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6"
          >
            Enterprise-grade protection.
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Everything you need to ship AI confidently, without compromising on latency, accuracy, or user experience.
          </motion.p>
        </div>

        {/* Premium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              // Theme-adaptive, premium card styling with lift effect
              className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 transition-all duration-300 hover:border-primary/40 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Subtle hover glow inside the card */}
              <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 rounded-full bg-primary/5 blur-[40px] transition-all duration-500 group-hover:bg-primary/15 group-hover:blur-[50px] pointer-events-none" />
              
              <div className="relative z-10">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-110">
                  <feature.icon className="h-6 w-6" />
                </div>
                
                <h3 className="mb-3 text-xl font-bold text-foreground tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  )
}