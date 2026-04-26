interface CsvRecord {
  id: string;
  textToEvaluate: string;
  originalRow: string;
  action: string | null;
  threatLabel: string | null;
  threatScore: number | null;
  ruleMatched: string | null;
  ruleScore: number | null;
  auditVerdict: string | null;
  auditReasoning: string | null;
  auditSuggestion: string | null;
  riskLevel: string | null;
  finalScore: number | null;
  status: string;
  processedAt: string | null;
  auditedAt: string | null;
}

interface BatchSummary {
  id: string;
  filename: string;
  status: string;
  totalRows: number;
  processed: number;
  auditorCompleted: number;
  createdAt: string;
}

interface Stats {
  total: number;
  blocked: number;
  passed: number;
  errors: number;
  highRisk: number;
  mediumRisk: number;
  lowRisk: number;
  falsePositives: number;
  falseNegatives: number;
  avgFinalScore: number | null;
}