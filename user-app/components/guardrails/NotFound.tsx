import { Shield } from 'lucide-react'
import React from 'react'

export default function GuardRailsNotFound() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <Shield className="w-8 h-8 mb-4 text-muted-foreground/30" />
            <h3 className="text-[14px] font-medium text-foreground mb-1">No custom guardrails</h3>
            <p className="text-[13px] text-muted-foreground max-w-sm mb-6">
                Add workspace-specific compliance logic to supplement the standard Aegis templates.
            </p>
        </div>
    )
}
