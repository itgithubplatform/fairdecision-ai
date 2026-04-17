'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Shield, Loader2, AlertCircle, RefreshCcw, Filter, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { RuleRow, type CustomRule } from '@/components/guardrails/RuleRow'
import { CreateRuleDialog } from '@/components/guardrails/CreateRuleDialog'
import GuardRailsNotFound from '@/components/guardrails/NotFound'
import TabsAndSearch from '@/components/guardrails/TabsAndSearch'

export default function GuardrailsPage() {
  const [rules, setRules] = useState<CustomRule[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [apiError, setApiError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('system')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const fetchRules = async () => {
    setIsLoading(true)
    setApiError(null)
    try {
      const res = await fetch('/api/v1/rules')
      if (!res.ok) throw new Error('Failed to load workspace guardrails.')
      const data = await res.json()
      setRules(data)
    } catch (err: any) {
      setApiError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRules()
  }, [])

  const dynamicCategories = useMemo(() => {
    const cats = rules.map(r => r.category).filter(Boolean)
    return Array.from(new Set(cats)).sort()
  }, [rules])

  const handleSaveRule = async (ruleText: string, category: string) => {
    setApiError(null)
    const ruleCategory = category.trim() || 'Custom Policy'
    const tempId = `temp-${Date.now()}`
    
    const optimisticRule: CustomRule = {
      id: tempId, ruleText, category: ruleCategory, isSystem: false, isActive: true, createdAt: new Date().toISOString()
    }
    
    setRules([optimisticRule, ...rules])
    
    try {
      const res = await fetch('/api/v1/rules', { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleText, category: ruleCategory }) 
      })
      if (!res.ok) throw new Error('Failed to save guardrail.')
      const savedRule = await res.json()
      setRules(prev => prev.map(r => r.id === tempId ? savedRule : r))
    } catch (err: any) {
      setApiError(err.message)
      setRules(prev => prev.filter(r => r.id !== tempId))
    }
  }

  const toggleRule = async (id: string, currentStatus: boolean) => {
    setApiError(null)
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !currentStatus } : r))
    try {
      const res = await fetch(`/api/v1/rules/${id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Failed to update status.')
    } catch (err: any) {
      setApiError(err.message)
      setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: currentStatus } : r))
    }
  }

  const deleteRule = async (id: string) => {
    setApiError(null)
    const previousRules = [...rules]
    setRules(prev => prev.filter(r => r.id !== id))
    try {
      const res = await fetch(`/api/v1/rules/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete guardrail.')
    } catch (err: any) {
      setApiError(err.message)
      setRules(previousRules)
    }
  }

  const systemRules = rules.filter(r => r.isSystem)
  const customRules = rules.filter(r => !r.isSystem)

  const filteredSystemRules = systemRules.filter(r => {
    const matchesSearch = r.ruleText.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || r.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const filteredCustomRules = customRules.filter(r => 
    r.ruleText.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="max-w-[1040px] mx-auto p-6 md:p-10 font-sans animate-in fade-in duration-500">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">Compliance Guardrails</h1>
          <p className="text-[14px] text-muted-foreground max-w-xl">
            Manage the semantic policies Aegis enforces during real-time prompt evaluation.
          </p>
        </div>
        
        <CreateRuleDialog onSave={handleSaveRule} />
      </header>

      {/* ERROR BANNER */}
      <AnimatePresence>
        {apiError && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="mb-6 overflow-hidden">
            <div className="flex items-center justify-between p-3 rounded-md bg-destructive/10 border border-destructive/20 text-destructive text-[13px] font-medium">
              <div className="flex items-center gap-2"><AlertCircle className="w-4 h-4" />{apiError}</div>
              <Button variant="ghost" size="sm" onClick={fetchRules} className="h-7 px-2 hover:bg-destructive/20 text-destructive"><RefreshCcw className="w-3 h-3 mr-1.5" /> Retry</Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-32 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin mb-3" />
          <p className="text-[13px]">Syncing workspace configuration...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          
          {/* THE UNIFIED CONTROL BAR */}
          <TabsAndSearch
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            dynamicCategories={dynamicCategories}
          />

          {/* TAB 1: SYSTEM TEMPLATES */}
          <TabsContent value="system" className="space-y-4 outline-none mt-0">
            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
              {filteredSystemRules.length === 0 ? (
                <div className="py-16 flex flex-col items-center text-center text-muted-foreground">
                  <FileText className="w-8 h-8 mb-3 opacity-20" />
                  <p className="text-[13px]">No templates match your search criteria.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {filteredSystemRules.map(rule => (
                    <RuleRow key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          {/* TAB 2: CUSTOM RULES */}
          <TabsContent value="custom" className="space-y-4 outline-none mt-0">
            <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm min-h-[300px]">
              {filteredCustomRules.length === 0 ? (
               <GuardRailsNotFound />
              ) : (
                <div className="flex flex-col">
                  {filteredCustomRules.map(rule => (
                    <RuleRow key={rule.id} rule={rule} onToggle={toggleRule} onDelete={deleteRule} />
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
          
        </Tabs>
      )}
    </div>
  )
}