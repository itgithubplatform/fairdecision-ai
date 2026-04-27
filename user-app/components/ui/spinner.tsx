"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck } from "lucide-react";

const LOADING_STATES = [
  "Securing workspace session...",
  "Loading compliance policies...",
  "Waking up Fast Engine...",
  "Establishing live DB connection...",
];

export default function Spinner() {
  const [textIndex, setTextIndex] = useState(0);

  // Cycle through the loading text to simulate a complex boot sequence
  useEffect(() => {
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % LOADING_STATES.length);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-[80vh] w-full flex flex-col items-center justify-center bg-background relative overflow-hidden">
      
      {/* --- ANIMATED CORE --- */}
      <div className="relative flex items-center justify-center w-40 h-40 mb-8">
        
        {/* Background Ambient Glow */}
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" 
        />

        {/* Outer Orbit Ring (Clockwise) */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 border border-primary/20 rounded-full border-t-primary/60 border-l-primary/40 shadow-[0_0_15px_rgba(var(--primary),0.1)]"
        />

        {/* Inner Orbit Ring (Counter-Clockwise) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-4 border border-dashed border-primary/30 rounded-full border-b-primary border-r-primary"
        />

        {/* Central Shield Container */}
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="relative z-10 w-16 h-16 bg-primary/10 border border-primary/40 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] backdrop-blur-sm"
        >
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <ShieldCheck className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),0.8)]" />
          </motion.div>
        </motion.div>
      </div>

      {/* --- TEXT SEQUENCE --- */}
      <div className="flex flex-col items-center space-y-3 h-16 text-center">
        <motion.h3 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold tracking-tight text-foreground uppercase"
        >
          Aegis Engine
        </motion.h3>
        
        <div className="relative h-5 flex items-center justify-center w-full">
          <AnimatePresence mode="wait">
            <motion.p
              key={textIndex}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
              className="text-sm font-mono text-muted-foreground absolute"
            >
              {LOADING_STATES[textIndex]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}