"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  UploadCloud, CheckCircle2, AlertCircle, Loader2,
  FileSpreadsheet, Shield, Brain,
  Clock, Zap, Eye, RefreshCw, TrendingUp,
  ArrowRight, X,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Batch {
  id: string;
  filename: string;
  createdAt: string;
  status: string;
  processed: number;
  auditorCompleted: number;
  totalRows: number;
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
      setTimeout(() => { 
        setFile(null); 
        setUploadStatus("idle"); 
      }, 4000);
    } catch (err: unknown) {
      setUploadStatus("error");
      setErrorMessage(err instanceof Error ? err.message : "Unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case "COMPLETED": return <Badge variant="secondary" className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/25">Completed</Badge>;
      case "PROCESSING": return <Badge variant="secondary" className="bg-blue-500/15 text-blue-600 hover:bg-blue-500/25 animate-pulse">Processing</Badge>;
      case "FAILED": return <Badge variant="destructive">Failed</Badge>;
      default: return <Badge variant="outline" className="text-amber-500 border-amber-500">Pending</Badge>;
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto p-6 md:p-10 font-sans animate-in fade-in duration-500">
<header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
  <div className="space-y-1">
    <div className="flex items-center gap-2.5 mb-2">
      <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
        <Shield className="w-5 h-5 text-primary" />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">Batch Diagnostics Engine</h1>
    </div>
    <p className="text-[14px] text-muted-foreground max-w-xl">
      Upload datasets for sequential bias screening, toxicity analysis, and AI-powered auditing.
    </p>
  </div>
  
  {/* NEW: Download Button */}
  <div className="shrink-0">
    <Button asChild variant="outline" className="h-9 text-xs font-medium bg-background shadow-sm hover:bg-accent transition-all">
      <a href="/test_dataset.csv" download="test_dataset.csv">
        <Download className="w-3.5 h-3.5 mr-2" />
        Download Sample CSV
      </a>
    </Button>
  </div>
</header>

      {/* ── Upload Zone ── */}
      <Card 
        className={`mb-10 border-2 border-dashed transition-all duration-200 ${
          isDragging ? "border-primary bg-primary/5 scale-[1.01]" : "border-border bg-card hover:bg-muted/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
      >
        <CardContent className="p-10 flex flex-col items-center justify-center min-h-[300px]">
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!file ? (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-4 bg-muted rounded-full">
                <UploadCloud className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-medium">Drop your CSV dataset here</h3>
                <p className="text-sm text-muted-foreground">Supports .csv files up to 5MB.</p>
              </div>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
            </div>
          ) : (
            <div className="w-full max-w-md space-y-6">
              
              <div className="flex items-center justify-between p-4 border rounded-xl bg-background shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <FileSpreadsheet className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
                {uploadStatus === "idle" && (
                  <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>

              {uploadStatus === "error" && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{errorMessage}</AlertDescription>
                </Alert>
              )}
              
              {uploadStatus === "success" && (
                <Alert className="border-emerald-500/50 bg-emerald-500/10 text-emerald-600">
                  <CheckCircle2 className="h-4 w-4 stroke-emerald-600" />
                  <AlertTitle>Success</AlertTitle>
                  <AlertDescription>Upload successful! Processing pipeline started.</AlertDescription>
                </Alert>
              )}

              <Button 
                className="w-full" 
                size="lg"
                onClick={handleUpload}
                disabled={loading || uploadStatus === "success"}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Ingesting Data...</>
                ) : (
                  <><Zap className="w-4 h-4 mr-2" /> Launch AI Pipeline</>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Recent Batches ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium flex items-center gap-2 text-foreground">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            Recent Pipeline Jobs
          </h2>
          <Button variant="ghost" size="sm" onClick={fetchBatches} className="h-8 px-2 text-muted-foreground">
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
        </div>

        {batches.length === 0 ? (
          /* THE EMPTY STATE */
          <div className="flex flex-col items-center justify-center p-12 text-center border-2 border-dashed rounded-xl bg-card/50">
            <div className="p-4 bg-muted/50 rounded-full mb-4">
              <FileSpreadsheet className="w-8 h-8 text-muted-foreground opacity-50" />
            </div>
            <h3 className="text-base font-medium text-foreground">No pipeline jobs yet</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm">
              Upload a CSV dataset above to run your first background audit and toxicity screen.
            </p>
          </div>
        ) : (
          /* THE POPULATED GRID */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {batches.map((batch) => (
              <Card key={batch.id} className="shadow-sm">
                <CardHeader className="pb-3 border-b border-border/50">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1 overflow-hidden">
                      <CardTitle className="text-sm font-medium truncate" title={batch.filename}>
                        {batch.filename}
                      </CardTitle>
                      <CardDescription className="flex items-center text-[11px]">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(batch.createdAt).toLocaleDateString("en-IN", {
                          month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"
                        })}
                      </CardDescription>
                    </div>
                    {getStatusBadge(batch.status)}
                  </div>
                </CardHeader>
                
                <CardContent className="pt-4 space-y-4">
                  {/* Guardrail Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Shield className="w-3 h-3"/> Fast Engine</span>
                      <span>{batch.processed} / {batch.totalRows}</span>
                    </div>
                    <Progress value={batch.totalRows > 0 ? (batch.processed / batch.totalRows) * 100 : 0} className="h-1.5" />
                  </div>

                  {/* Auditor Progress */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                      <span className="flex items-center gap-1.5"><Brain className="w-3 h-3"/> AI Auditor</span>
                      <span>{batch.auditorCompleted} / {batch.totalRows}</span>
                    </div>
                    <Progress 
                      value={batch.totalRows > 0 ? (batch.auditorCompleted / batch.totalRows) * 100 : 0} 
                      className="h-1.5 [&>div]:bg-indigo-500" 
                    />
                  </div>
                </CardContent>
                
                {batch.status === "COMPLETED" && (
                  <div className="p-3 border-t bg-muted/20">
                    <Button asChild variant="ghost" className="w-full h-8 text-xs group justify-between">
                      <Link href={`/dashboard/csv-upload/${batch.id}`}>
                        View Full Results
                        <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-1" />
                      </Link>
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}