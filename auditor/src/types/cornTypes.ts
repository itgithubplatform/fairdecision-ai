// No MongoDB imports — migrated to Prisma + PostgreSQL

export interface ExecutionData {
  gate_triggered: string;
  total_latency_ms: number;
  roberta_latency_ms?: number;
  deberta_latency_ms?: number;
}

export interface DecisionData {
  action: "AUTO_PASSED" | "AUTO_BLOCKED" | "QUARANTINED" | "MODIFIED";
  triggered_rule: string;
  confidence_score: number;
}

export interface AuditData {
  status: "PENDING" | "PROCESSED";
  verdict?: "AGREE" | "FALSE_POSITIVE" | "FALSE_NEGATIVE";
  reasoning?: string;
  suggestion?: string;
  audited_at?: Date;
}

// Represents a row from the guardrail_logs table (Prisma model)
export interface GuardrailLog {
  id: string;
  timestamp: Date;
  end_user_id: string;
  user_prompt: string;
  gate_triggered: string;
  total_latency_ms: number;
  roberta_latency_ms?: number | null;
  deberta_latency_ms?: number | null;
  action: "AUTO_PASSED" | "AUTO_BLOCKED" | "QUARANTINED" | "MODIFIED";
  triggered_rule: string;
  confidence_score: number;
  audit_status: "PENDING" | "PROCESSED";
  audit_verdict?: string | null;
  audit_reasoning?: string | null;
  audit_suggestion?: string | null;
  audit_audited_at?: Date | null;
}

export interface GeminiAuditResult {
  log_id: string;
  step_by_step_reasoning: string;
  final_verdict: "AGREE" | "FALSE_POSITIVE" | "FALSE_NEGATIVE";
  suggested_rule_update?: string;
}
