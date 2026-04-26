import React, { useState } from 'react'
import { Badge } from '../ui/badge'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle2, ChevronDown, Loader2, Sparkles, Wand2, Flag, Send } from 'lucide-react'
import { Card, CardContent } from '../ui/card'
import { Button } from '../ui/button'

function LogRow({ log, isExpanded, onToggle }: { log: any, isExpanded: boolean, onToggle: () => void }) {

  const [isHealing, setIsHealing] = useState(false)
  const [healResult, setHealResult] = useState<any | null>(null)
  
  // Deployment State
  const [isDeploying, setIsDeploying] = useState(false)
  const [deploySuccess, setDeploySuccess] = useState(false)
  
  const [isManualOverride, setIsManualOverride] = useState(false)
  const [humanFeedback, setHumanFeedback] = useState("")
  
  const [isMounted, setIsMounted] = useState(false)
  React.useEffect(() => {
    setIsMounted(true)
  }, [])
  
  const violations = log.violationData?.violations || []

  // 1. GENERATE THE RULE PREVIEW
  const handleGenerateRule = async (isManual: boolean = false) => {
    setIsHealing(true)
    // Reset deploy states if regenerating
    setDeploySuccess(false) 
    
    try {
      const feedbackString = isManual 
        ? `Human Override Directive: ${humanFeedback}` 
        : `AI Background Auditor Notes: ${log.auditorNotes}`;
        
      let targetDecision;
      if (!isManual) {
        targetDecision = log.auditorStatus === 'FALSE_POSITIVE' ? 'ALLOW' : 'BLOCK';
      } else {
        targetDecision = log.decision === 'BLOCK' ? 'ALLOW' : 'BLOCK';
      }

      const res = await fetch('/api/v1/heal-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promptText: log.prompt,
          fastEngineDecision: log.decision,
          resolutionContext: feedbackString,
          intendedDecision: targetDecision 
        })
      })

      const data = await res.json()
      setHealResult(data) 
      
    } catch (error) {
      console.error("Failed to generate rule preview", error)
    } finally {
      setIsHealing(false)
    }
  }

  // 2. DEPLOY THE APPROVED RULE
  const handleDeploy = async () => {
    if (!healResult || healResult.isDuplicate) return;
    setIsDeploying(true);
    
    try {
      const res = await fetch('/api/v1/deploy-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ruleText: healResult.proposedRuleText,
          sourcePrompt: log.prompt,
          category: healResult.category || "General Compliance"
        })
      });
      
      if (res.ok) {
        setDeploySuccess(true);
      } else {
        console.error("Deployment failed", await res.json());
      }
    } catch (error) {
      console.error("Failed to deploy rule", error);
    } finally {
      setIsDeploying(false);
    }
  };

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
                <Card className="shadow-none border-border/50 bg-background">
                  <CardContent className="p-4 text-[13px] font-mono leading-relaxed">
                    "{log.prompt}"
                  </CardContent>
                </Card>
                {violations.length > 0 && (
                  <div className="text-[12px] text-muted-foreground flex items-center gap-2">
                    <span>Triggered Rule:</span>
                    <span className="font-medium text-destructive bg-destructive/10 px-2 py-0.5 rounded">
                      {violations[0].rule}
                    </span>
                    <span className="ml-auto">{(violations[0].score * 100).toFixed(1)}% Match</span>
                  </div>
                )}
              </div>

              {/* RIGHT: AI Auditor & Actions */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> AI Auditor Verdict
                </h4>
                
                <Card className="shadow-sm border-indigo-500/20 bg-indigo-500/5">
                  <CardContent className="p-4 space-y-4">
                    
                    {!log.isProcessed ? (
                       <p className="text-[12px] text-muted-foreground italic">Waiting for next background batch...</p>
                    ) : (
                       <p className="text-[13px] leading-relaxed italic border-l-2 border-indigo-500/40 pl-3 text-foreground/90">
                         "{log.auditorNotes}"
                       </p>
                    )}

                    {!healResult && (
                      <div className="pt-2 flex flex-col sm:flex-row gap-2">
                        {log.isProcessed && log.auditorStatus !== 'AGREE' && !isManualOverride && (
                          <Button 
                            onClick={() => handleGenerateRule(false)} 
                            disabled={isHealing} 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 shadow-sm"
                          >
                            {isHealing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 mr-2" />}
                            {isHealing ? "Analyzing Rules..." : "Auto-Heal Rule"}
                          </Button>
                        )}
                        
                        {!isManualOverride && (
                          <Button 
                            onClick={() => setIsManualOverride(true)} 
                            variant="outline" 
                            className="flex-1 text-xs h-8 bg-background border-border hover:bg-muted/50"
                          >
                            <Flag className="w-3.5 h-3.5 mr-2" />
                            Flag Issue
                          </Button>
                        )}
                      </div>
                    )}

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
                            placeholder="Provide context. E.g., 'Digital natives' refers to tech literacy here, not age..."
                            className="w-full text-[13px] p-3 rounded-md border border-border bg-background shadow-inner resize-none focus:ring-1 focus:ring-indigo-500 outline-none"
                            rows={3}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => setIsManualOverride(false)}
                            className="text-xs h-8"
                          >
                            Cancel
                          </Button>
                          <Button 
                            onClick={() => handleGenerateRule(true)} 
                            disabled={isHealing || humanFeedback.trim().length === 0} 
                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8"
                          >
                            {isHealing ? <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" /> : <Send className="w-3.5 h-3.5 mr-2" />}
                            {isHealing ? "Generating Fix..." : "Generate Custom Rule"}
                          </Button>
                        </div>
                      </motion.div>
                    )}

                    {/* 4. PROPOSED RULE OUTCOME & DEPLOYMENT */}
                    {healResult && (
                      <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="p-4 bg-background border border-indigo-500/30 rounded-lg mt-4 shadow-sm relative overflow-hidden">
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
                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Deployed Successfully</>
                          ) : healResult.isDuplicate ? (
                            "Rule Already Exists"
                          ) : (
                            "Approve & Deploy to Engine"
                          )}
                        </Button>
                      </motion.div>
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