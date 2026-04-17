import { Power, PowerOff, Shield, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type CustomRule = {
  id: string
  ruleText: string
  category: string
  isSystem: boolean
  isActive: boolean
  createdAt: string
}

interface RuleRowProps {
  rule: CustomRule
  onToggle: (id: string, currentStatus: boolean) => void
  onDelete: (id: string) => void
}

export function RuleRow({ rule, onToggle, onDelete }: RuleRowProps) {
  return (
    <div className={`group flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border-b border-border/50 last:border-0 bg-card transition-colors hover:bg-muted/30`}>
      <div className="flex-1 min-w-0 pr-4">
        <div className="flex items-center gap-3 mb-1.5">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${rule.isActive ? 'bg-emerald-500' : 'bg-muted-foreground/50'}`} />
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
              {rule.isActive ? 'Active' : 'Paused'}
            </span>
          </div>
          <div className="h-3 w-px bg-border" />
          <span className="text-[11px] font-medium text-muted-foreground tracking-wide">
            {rule.category}
          </span>
          {rule.isSystem && (
            <>
              <div className="h-3 w-px bg-border" />
              <span className="flex items-center gap-1 text-[11px] font-medium text-indigo-500/90 tracking-wide">
                <Shield className="w-3 h-3" /> Aegis Template
              </span>
            </>
          )}
        </div>
        
        <p className={`text-[14px] font-medium leading-relaxed ${rule.isActive ? 'text-foreground' : 'text-muted-foreground decoration-muted-foreground/30'}`}>
          {rule.ruleText}
        </p>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost" 
          size="sm" 
          onClick={() => onToggle(rule.id, rule.isActive)}
          className={`h-8 px-3 text-xs font-medium transition-colors ${
            rule.isActive 
              ? 'text-red-600 dark:text-red-400 hover:bg-red-500/10 hover:text-red-700 dark:hover:text-red-300' 
              : 'text-emerald-800 hover:bg-green-100'
          }`}
        >
          {rule.isActive ? <PowerOff className="w-3.5 h-3.5 mr-2" /> : <Power className="w-3.5 h-3.5 mr-2" />}
          {rule.isActive ? 'Pause' : 'Activate'}
        </Button>
        
        {!rule.isSystem && (
          <Button
            variant="ghost" 
            size="icon" 
            onClick={() => onDelete(rule.id)}
            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  )
}