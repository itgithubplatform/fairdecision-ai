import { useState } from 'react'
import { Plus, Sparkles, Loader2, CornerRightDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter
} from "@/components/ui/dialog"

interface CreateRuleDialogProps {
  onSave: (ruleText: string, category: string) => Promise<void>
}

export function CreateRuleDialog({ onSave }: CreateRuleDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // Standard Form State
  const [newRuleText, setNewRuleText] = useState('')
  const [newRuleCategory, setNewRuleCategory] = useState('')
  
  // AI Generator State
  const [aiPrompt, setAiPrompt] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSave = async () => {
    await onSave(newRuleText, newRuleCategory)
    setNewRuleText('')
    setNewRuleCategory('')
    setAiPrompt('')
    setIsOpen(false)
  }

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return
    setIsGenerating(true)
    
    try {
      const res = await fetch('/api/v1/generate-rule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      })
      
      if (!res.ok) throw new Error("Failed to generate rule")
      const data = await res.json()
      setNewRuleText(data.ruleText || '')
      setNewRuleCategory(data.category || '')
      
    } catch (error) {
      console.error("AI Generation Error:", error)
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="h-9 px-4 text-xs font-medium tracking-wide shadow-sm">
          <Plus className="w-3.5 h-3.5 mr-2" /> Create Policy
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden gap-0">
        
        <div className="px-6 pt-6 pb-4">
          <DialogHeader>
            <DialogTitle className="text-lg tracking-tight">New Workspace Guardrail</DialogTitle>
            <DialogDescription className="text-[13px]">
              Use Aegis AI to draft a strict semantic rule, or write it manually below.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-6">

          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-primary/5 p-1 shadow-inner">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
            
            <div className="bg-background/80 backdrop-blur-sm rounded-lg p-3 space-y-3">
              <label className="flex items-center gap-1.5 text-[11px] font-bold text-primary uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Draft with AI
              </label>
              
              <div className="space-y-2">
                <textarea
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Describe the behavior you want to block in plain English...&#10;e.g., 'Stop users from asking for medical advice or diagnoses.'"
                  className="w-full h-20 p-3 text-[13px] bg-background border border-input rounded-md shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 transition-shadow"
                />
                
                <div className="flex justify-end">
                  <Button 
                    onClick={handleAIGenerate} 
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="h-8 px-4 text-xs font-medium shadow-sm"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                        Analyzing Intent...
                      </>
                    ) : (
                      <>
                        Generate Rule <CornerRightDown className="w-3.5 h-3.5 ml-1.5 opacity-70" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-[10px] font-medium uppercase tracking-widest">
              Review & Configure
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground flex justify-between">
                Category
                <span className="text-muted-foreground/50 font-normal">Required for Analytics</span>
              </label>
              <input
                type="text" 
                value={newRuleCategory} 
                onChange={(e) => setNewRuleCategory(e.target.value)}
                placeholder="e.g., Clinical Safety, PII Leak, Toxicity"
                className="w-full h-9 px-3 text-[13px] bg-background border border-input rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>
            
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-foreground">Strict Rule Definition</label>
              <textarea
                value={newRuleText} 
                onChange={(e) => setNewRuleText(e.target.value)}
                placeholder="The exact semantic boundaries the engine will enforce..."
                className="w-full h-24 p-3 text-[13px] bg-background border border-input rounded-md shadow-sm resize-none focus:outline-none focus:ring-1 focus:ring-ring transition-all"
              />
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-muted/50 border-t border-border flex justify-end gap-2">
          <Button variant="ghost" className="h-9 text-xs font-medium" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button 
            className="h-9 text-xs font-medium shadow-sm" 
            onClick={handleSave} 
            disabled={!newRuleText.trim() || !newRuleCategory.trim()}
          >
            Save Guardrail
          </Button>
        </div>
        
      </DialogContent>
    </Dialog>
  )
}