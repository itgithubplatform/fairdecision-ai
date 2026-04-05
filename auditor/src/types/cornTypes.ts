import { ObjectId } from "mongodb";

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

export interface GuardrailLog extends Document {
  _id: ObjectId;
  timestamp: Date;
  end_user_id: string; 
  user_prompt: string;
  execution: ExecutionData; 
  decision: DecisionData;  
  audit: AuditData;         
}

export interface GeminiAuditResult {
  log_id: string;
  step_by_step_reasoning: string;
  final_verdict: "AGREE" | "FALSE_POSITIVE" | "FALSE_NEGATIVE";
  suggested_rule_update?: string;
}
