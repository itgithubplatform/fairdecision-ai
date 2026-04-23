'use client'

import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Play, Terminal, ArrowRight } from "lucide-react"

export default function CTASection() {
  return (
    <section className="py-24 md:py-32 relative px-4 sm:px-6 lg:px-8 bg-background">
      <div className="container mx-auto max-w-5xl">
        
        {/* The Inverted Premium CTA Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.5rem] bg-[#0A0A0A] px-6 py-20 md:px-16 md:py-28 text-center"
        >
          {/* Internal Background Effects: Subtle Dark Grid + Brand Glow */}
          <div className="absolute inset-0 z-0 pointer-events-none">
            {/* White grid locked to a low opacity for perfect dark mode contrast */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff0a_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0a_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_100%,#000_70%,transparent_100%)]" />
            <div className="absolute -bottom-1/2 left-1/2 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-primary/40 blur-[120px]" />
          </div>

          <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-6 max-w-3xl">
              Build safe, fair, and compliant AI <br className="hidden sm:block" />
              <span className="text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.5)]">
                from day one.
              </span>
            </h2>

            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto leading-relaxed">
              Drop in our SDK and instantly protect your LLM endpoints from bias, toxicity, and compliance failures in under 5 minutes.
            </p>

            {/* Upgraded Button Group - Dark Mode variants */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full sm:w-auto">
              {/* Primary Button */}
              <Button size="lg" className="w-full sm:w-auto gap-2 group h-12 px-8 shadow-[0_0_20px_rgba(var(--primary),0.4)] hover:shadow-[0_0_30px_rgba(var(--primary),0.6)] transition-all border border-primary/50">
                <Play className="w-4 h-4 group-hover:scale-110 transition-transform" />
                Try Playground
              </Button>
              
              {/* Secondary Outline Button locked to dark mode styles */}
              <Button size="lg" variant="outline" className="w-full sm:w-auto gap-2 group h-12 px-8 bg-white/5 border-white/10 text-white hover:bg-white/15 hover:text-white transition-all">
                Get API Key
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

          </div>
        </motion.div>

      </div>
    </section>
  )
}