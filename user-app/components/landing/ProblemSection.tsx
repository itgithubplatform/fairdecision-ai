'use client'

import { motion } from "framer-motion"
import { AlertTriangle, ShieldOff, EyeOff, Scale } from "lucide-react"

const problems = [
  { 
    icon: Scale, 
    title: "Inherited Bias", 
    desc: "Models passively absorb and amplify historical biases from training data, leading to automated discrimination at scale." 
  },
  { 
    icon: ShieldOff, 
    title: "No Real-Time Safety", 
    desc: "Post-generation filtering is too slow. Unsafe and toxic content hits your users before your backend can react." 
  },
  { 
    icon: EyeOff, 
    title: "Zero Explainability", 
    desc: "When an LLM makes a biased decision, it operates as a black box. Auditing its reasoning natively is nearly impossible." 
  },
  { 
    icon: AlertTriangle, 
    title: "Compliance Risk", 
    desc: "EEOC and Fair Lending violations carry massive legal risks. Unfiltered AI isn't just bad UX; it's a direct enterprise liability." 
  }
]

export default function ProblemSection() {
  return (
    <section className="relative py-24 md:py-32 bg-background overflow-hidden border-t border-border/30">
      
      {/* Subtle background brand glow to tie the section together */}
      <div className="absolute left-1/2 top-0 -z-10 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px] opacity-50 pointer-events-none" />

      <div className="container mx-auto px-6 max-w-6xl relative z-10">

        {/* Header Block */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20 md:text-center flex flex-col items-center"
        >         
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground mb-6">
            AI systems are <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary/90 to-indigo-800">flawed by default.</span>
          </h2>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Without an active inline firewall, your application is exposed to unpredictable, unfair, and non-compliant LLM behavior.
          </p>
        </motion.div>

        {/* Premium Bento Grid - Theme Adaptive */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {problems.map((problem, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              // ADAPTIVE STYLING: Uses bg-card, border-border, and a subtle shadow that looks great on light mode
              className="group relative overflow-hidden rounded-[2rem] border border-border bg-card p-8 md:p-10 transition-all duration-500 hover:border-primary/50 hover:shadow-lg hover:-translate-y-1"
            >
              {/* Radial gradient orb inside the card that intensifies on hover */}
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/5 blur-[50px] transition-all duration-500 group-hover:bg-primary/20 group-hover:blur-[60px] pointer-events-none" />
              
              <div className="relative z-10">
                {/* High-end Icon Container */}
                <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-500 group-hover:scale-110">
                  <problem.icon className="h-6 w-6" />
                </div>
                
                {/* Text relies purely on text-foreground and text-muted-foreground for perfect contrast */}
                <h3 className="mb-4 text-2xl font-bold text-foreground tracking-tight">
                  {problem.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-base font-medium">
                  {problem.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
        
      </div>
    </section>
  )
}