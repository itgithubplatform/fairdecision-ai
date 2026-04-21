"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud, CheckCircle2, AlertCircle, Loader2,
  FileSpreadsheet, Shield, Brain,
  Clock, Zap, Eye, RefreshCw, TrendingUp
} from "lucide-react";

interface Batch {
  id: string;
  filename: string;
  createdAt: string;
  status: string;
  processed: number;
  auditorCompleted: number;
  totalRows: number;
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    COMPLETED: "badge-success",
    FAILED: "badge-danger",
    PROCESSING: "badge-info",
    PENDING: "badge-warning",
  };
  return (
    <span className={`status-badge ${map[status] ?? "badge-warning"}`}>
      {status === "PROCESSING" && <span className="badge-dot" />}
      {status}
    </span>
  );
}

function ProgressBar({ value, max, variant = "primary" }: { value: number; max: number; variant?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="prog-track">
      <div className={`prog-fill prog-${variant}`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export default function CsvUploadDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBatches = useCallback(async () => {
    try {
      const res = await fetch("/api/csv-batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  }, []);

  useEffect(() => {
    fetchBatches();
    const interval = setInterval(fetchBatches, 4000);
    return () => clearInterval(interval);
  }, [fetchBatches]);

  const validateAndSetFile = (f: File) => {
    if (!f.name.endsWith(".csv")) {
      setUploadStatus("error");
      setErrorMessage("Please select a valid .csv file.");
      return;
    }
    if (f.size > 5 * 1024 * 1024) {
      setUploadStatus("error");
      setErrorMessage("File exceeds the 5MB size limit.");
      return;
    }
    setFile(f);
    setUploadStatus("idle");
    setErrorMessage("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) validateAndSetFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.[0]) validateAndSetFile(e.dataTransfer.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploadStatus("uploading");
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/upload-csv", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadStatus("success");
      fetchBatches();
      setTimeout(() => { setFile(null); setUploadStatus("idle"); }, 4000);
    } catch (err: unknown) {
      setUploadStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="csv-page">
      {/* ── Header ── */}
      <div className="csv-header">
        <div className="csv-header-icon">
          <Shield size={28} />
        </div>
        <div>
          <h1 className="csv-title">Batch Diagnostics Engine</h1>
          <p className="csv-subtitle">
            Upload datasets for sequential bias screening, toxicity analysis, and AI-powered auditing.
          </p>
        </div>
      </div>

      {/* ── Upload Zone ── */}
      <div
        className={`upload-zone ${isDragging ? "upload-zone-active" : ""} ${file ? "upload-zone-filled" : ""}`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <input
          type="file"
          accept=".csv"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />

        {!file ? (
          <div className="upload-empty">
            <div className="upload-cloud-icon">
              <UploadCloud size={44} />
            </div>
            <h3 className="upload-heading">Drop your CSV here</h3>
            <p className="upload-hint">Supports .csv files up to 5MB</p>
            <button className="btn-primary" onClick={() => fileInputRef.current?.click()}>
              Browse Files
            </button>
          </div>
        ) : (
          <div className="upload-filled">
            <div className="file-card">
              <div className="file-card-icon">
                <FileSpreadsheet size={32} />
              </div>
              <div className="file-card-info">
                <p className="file-name">{file.name}</p>
                <p className="file-size">{(file.size / 1024).toFixed(1)} KB · CSV</p>
              </div>
            </div>

            {uploadStatus === "error" && (
              <div className="alert alert-error">
                <AlertCircle size={16} />
                <span>{errorMessage}</span>
              </div>
            )}
            {uploadStatus === "success" && (
              <div className="alert alert-success">
                <CheckCircle2 size={16} />
                <span>Upload successful! Processing pipeline started.</span>
              </div>
            )}

            <div className="upload-actions">
              <button
                className="btn-primary btn-launch"
                onClick={handleUpload}
                disabled={loading || uploadStatus === "success"}
              >
                {loading
                  ? <><Loader2 className="spin" size={18} /> Processing…</>
                  : <><Zap size={18} /> Launch Pipeline</>
                }
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Recent Batches ── */}
      {batches.length > 0 && (
        <div className="batches-section">
          <div className="section-header">
            <div className="section-title">
              <TrendingUp size={20} />
              <span>Recent Batch Jobs</span>
            </div>
            <button className="btn-icon" onClick={fetchBatches} title="Refresh">
              <RefreshCw size={16} />
            </button>
          </div>

          <div className="batch-grid">
            {batches.map((batch) => (
              <div key={batch.id} className="batch-card">
                <div className="batch-card-top">
                  <div className="batch-info">
                    <p className="batch-filename">{batch.filename}</p>
                    <p className="batch-meta">
                      <Clock size={11} />
                      {new Date(batch.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                        hour: "2-digit", minute: "2-digit"
                      })}
                    </p>
                  </div>
                  <StatusBadge status={batch.status} />
                </div>

                <div className="batch-progress-row">
                  <div className="batch-progress-col">
                    <div className="batch-progress-label">
                      <Shield size={11} /> Guardrail
                      <span className="ml-auto">{batch.processed}/{batch.totalRows}</span>
                    </div>
                    <ProgressBar value={batch.processed} max={batch.totalRows} variant="primary" />
                  </div>
                  <div className="batch-progress-col">
                    <div className="batch-progress-label">
                      <Brain size={11} /> Auditor
                      <span className="ml-auto">{batch.auditorCompleted}/{batch.totalRows}</span>
                    </div>
                    <ProgressBar value={batch.auditorCompleted} max={batch.totalRows} variant="accent" />
                  </div>
                </div>

                {batch.status === "COMPLETED" && (
                  <Link href={`/dashboard/csv-upload/${batch.id}`} className="batch-results-link">
                    <Eye size={14} /> View Full Results
                    <ArrowRight size={14} />
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
