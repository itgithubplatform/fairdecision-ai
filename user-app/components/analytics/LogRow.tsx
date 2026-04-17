import React, { useState } from 'react'
import { Badge } from '../ui/badge'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

function LogRow({ log, isExpanded, onToggle }: { log: any, isExpanded: boolean, onToggle: () => void }) {

  const [isHealing, setIsHealing] = useState(false)
  const [healResult, setHealResult] = useState<any | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const violations = log.violationData?.violations || []

  const handleHealRule = async () => {
    setIsHealing(true)
    try {
      const res = await fetch('/api/v1/heal-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: log.prompt,
          failedDecision: log.decision,
          intendedDecision: log.auditorStatus === 'FALSE_POSITIVE' ? 'ALLOW' : 'BLOCK'
        })
      })

      const data = await res.json()
      
      
    } catch (error) {
     
    } finally {
      setIsHealing(false)
    }
  }

  // Shadcn Badge Variants mapped to your logic
  const getDecisionBadge = (decision: string) => {
    if (decision === 'BLOCK') return <Badge variant="destructive" className="uppercase text-[10px]">Blocked</Badge>
    if (decision === 'ALLOW') return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25 uppercase text-[10px]">Passed</Badge>
    return <Badge variant="outline" className="text-amber-500 border-amber-500 uppercase text-[10px]">Flagged</Badge>
  }

  return (
    <motion.div layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col border-b last:border-0">
      
      {/* VISIBLE ROW */}
      <div onClick={onToggle} className={`grid grid-cols-12 gap-4 px-6 py-4 cursor-pointer hover:bg-muted/30 items-center transition-colors ${isExpanded ? 'bg-muted/20' : ''}`}>
        
        <div className="col-span-2">
          {getDecisionBadge(log.decision)}
        </div>

        <div className="col-span-2 flex items-center text-[12px]">
          {!log.isProcessed ? <span className="text-muted-foreground flex items-center"><Loader2 className="w-3 h-3 animate-spin mr-1"/> Pending</span> :
           log.auditorStatus === 'AGREE' ? <span className="text-emerald-500 flex items-center"><CheckCircle2 className="w-3 h-3 mr-1"/> Agreed</span> :
           <span className="text-amber-500 flex items-center"><AlertTriangle className="w-3 h-3 mr-1"/> Disagreed</span>}
        </div>
        
        <div className="col-span-6 pr-4">
          <p className="text-[13px] font-medium truncate">{log.prompt}</p>
        </div>

        <div className="col-span-2 flex items-center justify-end gap-3 text-[11px] text-muted-foreground">
          <span>{isMounted ? new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* EXPANDED PANEL */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-muted/10 border-t">
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* LEFT: Fast Engine */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Fast Engine Data</h4>
                <Card className="shadow-none">
                  <CardContent className="p-4 text-[13px] font-mono leading-relaxed">
                    "{log.prompt}"
                  </CardContent>
                </Card>
                {violations.length > 0 && (
                  <div className="text-[12px] text-muted-foreground">
                    Triggered Rule: <strong className="text-foreground">{violations[0].rule}</strong> ({(violations[0].score * 100).toFixed(1)}% Match)
                  </div>
                )}
              </div>

              {/* RIGHT: AI Auditor */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Auditor Verdict
                </h4>
                
                <Card className="shadow-sm">
                  <CardContent className="p-4 space-y-4">
                    {!log.isProcessed ? (
                       <p className="text-[12px] text-muted-foreground">Waiting for next background batch...</p>
                    ) : (
                      <>
                        <p className="text-[13px] leading-relaxed italic border-l-2 border-primary/20 pl-3">
                          "{log.auditorNotes}"
                        </p>

                        {/* Self-Healing Button */}
                        {log.auditorStatus !== 'AGREED' && !healResult && (
                          <div className="pt-2">
                            <Button onClick={handleHealRule} disabled={isHealing} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8">
                              {isHealing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-2" />}
                              {isHealing ? "Analyzing Rules..." : "Auto-Heal Rule Engine"}
                            </Button>
                          </div>
                        )}

                        {/* Proposed Rule Outcome */}
                        {healResult && (
                          <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-md mt-4">
                            <Badge variant="outline" className="text-indigo-500 border-indigo-500 mb-2">
                              {healResult.action.replace('_', ' ')}
                            </Badge>
                            <p className="text-[13px] font-medium mb-2">"{healResult.proposedRuleText}"</p>
                            <p className="text-[11px] text-muted-foreground mb-3">{healResult.reasoning}</p>
                            
                            <Button className="w-full text-xs h-8">
                              Deploy Update to Engine
                            </Button>
                          </motion.div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
export default LogRow