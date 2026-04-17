'use client'

import React, { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Filter } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import LogRow from './LogRow'
import { Card } from '../ui/card'

export function RequestLogsTable({ initialLogs }: { initialLogs: any[] }) {
  const [filter, setFilter] = useState<string>('ALL')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filteredLogs = initialLogs.filter(log => {
    if (filter === 'ALL') return true
    if (filter === 'PENDING') return !log.isProcessed
    if (filter === 'AGREE') return log.auditorStatus === 'AGREE'
    if (filter === 'DISAGREE') return log.isProcessed && log.auditorStatus !== 'AGREE'
    return log.decision === filter
  })

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  return (
    <Card className="overflow-hidden shadow-sm flex flex-col">
      {/* FILTER BAR */}
      <div className="px-6 py-4 border-b bg-muted/30 flex justify-between items-center">
        <h3 className="text-sm font-semibold">Evaluation Queue</h3>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-[200px] h-9">
            <Filter className="w-3.5 h-3.5 mr-2 text-muted-foreground" />
            <SelectValue placeholder="Filter Logs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Traffic</SelectItem>
            <SelectItem value="PENDING" className="font-medium text-indigo-500">Pending Audit</SelectItem>
            <SelectItem value="DISAGREE" className="font-medium text-amber-500">Auditor Disagreed</SelectItem>
            <SelectItem value="AGREE">Auditor Agreed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* TABLE HEADER */}
      <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b bg-muted/50 text-[11px] font-medium text-muted-foreground uppercase">
        <div className="col-span-2">Engine Decision</div>
        <div className="col-span-2">Audit Status</div>
        <div className="col-span-6">Evaluated Prompt</div>
        <div className="col-span-2 text-right ">Time</div>
      </div>

      {/* TABLE BODY */}
      <div className="flex flex-col relative min-h-[300px]">
        <AnimatePresence mode="popLayout">
          {filteredLogs.map((log) => (
            <LogRow 
              key={log.id} 
              log={log} 
              isExpanded={expandedId === log.id} 
              onToggle={() => toggleExpand(log.id)} 
            />
          ))}
        </AnimatePresence>
      </div>
    </Card>
  )
}

