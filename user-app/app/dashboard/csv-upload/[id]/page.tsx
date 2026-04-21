"use client";

import React, { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, Shield, Brain, CheckCircle2, XCircle,
  AlertTriangle, TrendingUp, Clock, FileSpreadsheet,
  ChevronDown, ChevronUp, RefreshCw, Loader2
} from "lucide-react";

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

function RiskBadge({ level }: { level: string | null }) {
  if (!level) return <span className="risk-badge risk-none">—</span>;
  const classes: Record<string, string> = {
    HIGH: "risk-high", MEDIUM: "risk-medium", LOW: "risk-low",
  };
  return <span className={`risk-badge ${classes[level] ?? "risk-none"}`}>{level}</span>;
}

function VerdictBadge({ verdict }: { verdict: string | null }) {
  if (!verdict) return <span className="verdict-badge verdict-none">PENDING</span>;
  const classes: Record<string, string> = {
    AGREE: "verdict-agree",
    FALSE_POSITIVE: "verdict-fp",
    FALSE_NEGATIVE: "verdict-fn",
  };
  const labels: Record<string, string> = {
    AGREE: "✓ AGREE",
    FALSE_POSITIVE: "⚡ FALSE POSITIVE",
    FALSE_NEGATIVE: "⚠ FALSE NEGATIVE",
  };
  return <span className={`verdict-badge ${classes[verdict] ?? "verdict-none"}`}>{labels[verdict] ?? verdict}</span>;
}

function ActionBadge({ action }: { action: string | null }) {
  if (!action) return <span className="action-badge action-none">PENDING</span>;
  return (
    <span className={`action-badge ${action === "AUTO_BLOCKED" ? "action-blocked" : "action-passed"}`}>
      {action === "AUTO_BLOCKED"
        ? <><XCircle size={12} /> BLOCKED</>
        : <><CheckCircle2 size={12} /> PASSED</>
      }
    </span>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted-sm">—</span>;
  const pct = Math.round(score * 100);
  const color = pct >= 70 ? "score-high" : pct >= 40 ? "score-mid" : "score-low";
  return (
    <div className="score-bar-wrap">
      <div className="score-bar-track">
        <div className={`score-bar-fill ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="score-label">{pct}%</span>
    </div>
  );
}

function StatCard({
  icon: Icon, label, value, sub, color
}: {
  icon: React.ElementType; label: string; value: string | number; sub?: string; color: string;
}) {
  return (
    <div className={`stat-card stat-${color}`}>
      <div className={`stat-icon stat-icon-${color}`}><Icon size={20} /></div>
      <div className="stat-body">
        <p className="stat-value">{value}</p>
        <p className="stat-label">{label}</p>
        {sub && <p className="stat-sub">{sub}</p>}
      </div>
    </div>
  );
}

function RecordRow({ record }: { record: CsvRecord }) {
  const [expanded, setExpanded] = useState(false);
  const orig = (() => { try { return JSON.parse(record.originalRow); } catch { return {}; } })();

  return (
    <div className={`record-row ${record.riskLevel === "HIGH" ? "record-high" : ""}`}>
      <div className="record-main" onClick={() => setExpanded(!expanded)}>
        <div className="record-text">
          <p className="record-prompt">{record.textToEvaluate.substring(0, 120)}{record.textToEvaluate.length > 120 ? "…" : ""}</p>
          <div className="record-meta-row">
            {record.threatLabel && (
              <span className="record-tag">
                <AlertTriangle size={10} /> {record.threatLabel}
                {record.threatScore != null && ` (${(record.threatScore * 100).toFixed(0)}%)`}
              </span>
            )}
            {record.ruleMatched && (
              <span className="record-tag record-tag-rule">
                {record.ruleMatched}
              </span>
            )}
          </div>
        </div>
        <div className="record-badges">
          <ActionBadge action={record.action} />
          <VerdictBadge verdict={record.auditVerdict} />
          <RiskBadge level={record.riskLevel} />
          <ScoreBar score={record.finalScore} />
          <button className="expand-btn">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="record-expanded">
          <div className="record-expanded-grid">
            {/* Original Data */}
            <div className="expand-section">
              <h4 className="expand-title"><FileSpreadsheet size={14} /> Original Row</h4>
              <div className="expand-kv">
                {Object.entries(orig).map(([k, v]) => (
                  <div key={k} className="kv-row">
                    <span className="kv-key">{k}</span>
                    <span className="kv-val">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guardrail Output */}
            <div className="expand-section">
              <h4 className="expand-title"><Shield size={14} /> Guardrail Decision</h4>
              <div className="expand-kv">
                <div className="kv-row"><span className="kv-key">Action</span><ActionBadge action={record.action} /></div>
                <div className="kv-row"><span className="kv-key">Threat</span><span className="kv-val">{record.threatLabel ?? "—"}</span></div>
                <div className="kv-row"><span className="kv-key">Threat Score</span><span className="kv-val">{record.threatScore != null ? `${(record.threatScore * 100).toFixed(1)}%` : "—"}</span></div>
                <div className="kv-row"><span className="kv-key">Rule Matched</span><span className="kv-val">{record.ruleMatched ?? "—"}</span></div>
                <div className="kv-row"><span className="kv-key">Rule Score</span><span className="kv-val">{record.ruleScore != null ? `${(record.ruleScore * 100).toFixed(1)}%` : "—"}</span></div>
              </div>
            </div>

            {/* Auditor Output */}
            <div className="expand-section expand-section-wide">
              <h4 className="expand-title"><Brain size={14} /> Auditor Verdict</h4>
              <div className="expand-kv">
                <div className="kv-row"><span className="kv-key">Verdict</span><VerdictBadge verdict={record.auditVerdict} /></div>
                <div className="kv-row"><span className="kv-key">Risk Level</span><RiskBadge level={record.riskLevel} /></div>
                <div className="kv-row"><span className="kv-key">Final Score</span><ScoreBar score={record.finalScore} /></div>
                {record.auditReasoning && (
                  <div className="kv-col">
                    <span className="kv-key">Reasoning</span>
                    <span className="kv-val kv-reasoning">{record.auditReasoning}</span>
                  </div>
                )}
                {record.auditSuggestion && (
                  <div className="kv-col">
                    <span className="kv-key">Suggested Rule Update</span>
                    <span className="kv-val kv-suggestion">{record.auditSuggestion}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function BatchDetailPage() {
  const params = useParams();
  const batchId = params?.id as string;

  const [batch, setBatch] = useState<BatchSummary | null>(null);
  const [records, setRecords] = useState<CsvRecord[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "BLOCKED" | "PASSED" | "HIGH">("ALL");

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/csv-batches/${batchId}`);
      if (res.ok) {
        const data = await res.json();
        setBatch(data.batch);
        setRecords(data.records);
        setStats(data.stats);
      }
    } catch (err) {
      console.error("Failed to load batch", err);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
    // Auto-refresh if still processing
    const interval = setInterval(() => {
      if (batch?.status !== "COMPLETED") fetchData();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchData, batch?.status]);

  const filteredRecords = records.filter((r) => {
    if (filter === "ALL") return true;
    if (filter === "BLOCKED") return r.action === "AUTO_BLOCKED";
    if (filter === "PASSED") return r.action === "AUTO_PASSED";
    if (filter === "HIGH") return r.riskLevel === "HIGH";
    return true;
  });

  if (loading) {
    return (
      <div className="detail-loading">
        <Loader2 className="spin" size={40} />
        <p>Loading batch results…</p>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="detail-loading">
        <AlertTriangle size={40} />
        <p>Batch not found.</p>
        <Link href="/dashboard/csv-upload" className="btn-primary mt-4">← Back</Link>
      </div>
    );
  }

  return (
    <div className="detail-page">
      {/* ── Top Bar ── */}
      <div className="detail-topbar">
        <Link href="/dashboard/csv-upload" className="back-link">
          <ArrowLeft size={16} /> Back to Batches
        </Link>
        <button className="btn-icon" onClick={fetchData} title="Refresh">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* ── Batch Header ── */}
      <div className="detail-header">
        <div className="detail-header-icon"><FileSpreadsheet size={28} /></div>
        <div className="detail-header-info">
          <h1 className="detail-title">{batch.filename}</h1>
          <div className="detail-meta">
            <Clock size={13} />
            {new Date(batch.createdAt).toLocaleString()}
            <span className={`status-badge ${
              batch.status === "COMPLETED" ? "badge-success" :
              batch.status === "FAILED" ? "badge-danger" :
              "badge-info"
            }`}>
              {batch.status === "PROCESSING" && <span className="badge-dot" />}
              {batch.status}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats Grid ── */}
      {stats && (
        <div className="stats-grid">
          <StatCard icon={FileSpreadsheet} label="Total Records" value={stats.total} color="purple" />
          <StatCard icon={XCircle}        label="Blocked"        value={stats.blocked} sub={`${stats.total > 0 ? Math.round(stats.blocked / stats.total * 100) : 0}% of total`} color="red" />
          <StatCard icon={CheckCircle2}   label="Passed"         value={stats.passed}  sub={`${stats.total > 0 ? Math.round(stats.passed / stats.total * 100) : 0}% of total`} color="green" />
          <StatCard icon={AlertTriangle}  label="High Risk"      value={stats.highRisk} color="orange" />
          <StatCard icon={TrendingUp}     label="Avg Safety Score" value={stats.avgFinalScore != null ? `${Math.round(stats.avgFinalScore * 100)}%` : "—"} color="teal" />
          <StatCard icon={Brain}          label="False Negatives" value={stats.falseNegatives} sub="Guardrail missed" color="yellow" />
        </div>
      )}

      {/* ── Risk Distribution ── */}
      {stats && (
        <div className="risk-distribution">
          <h3 className="section-label">Risk Distribution</h3>
          <div className="risk-bars">
            {[
              { label: "High Risk",    value: stats.highRisk,   color: "rgb(239,68,68)", cls: "rbar-red" },
              { label: "Medium Risk",  value: stats.mediumRisk, color: "rgb(249,115,22)", cls: "rbar-orange" },
              { label: "Low Risk",     value: stats.lowRisk,    color: "rgb(34,197,94)", cls: "rbar-green" },
            ].map((item) => (
              <div key={item.label} className="risk-bar-row">
                <span className="risk-bar-label">{item.label}</span>
                <div className="risk-bar-track">
                  <div
                    className={`risk-bar-fill ${item.cls}`}
                    style={{ width: `${stats.total > 0 ? (item.value / stats.total) * 100 : 0}%` }}
                  />
                </div>
                <span className="risk-bar-count">{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Records Table ── */}
      <div className="records-section">
        <div className="records-header">
          <h3 className="section-label">
            Record Results
            <span className="records-count">{filteredRecords.length}</span>
          </h3>
          <div className="filter-tabs">
            {(["ALL", "BLOCKED", "PASSED", "HIGH"] as const).map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? "filter-tab-active" : ""}`}
                onClick={() => setFilter(f)}
              >
                {f === "HIGH" ? "🔴 High Risk" : f}
              </button>
            ))}
          </div>
        </div>

        <div className="records-list">
          {filteredRecords.length === 0 ? (
            <div className="records-empty">
              <p>No records match this filter.</p>
            </div>
          ) : (
            filteredRecords.map((record) => (
              <RecordRow key={record.id} record={record} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
