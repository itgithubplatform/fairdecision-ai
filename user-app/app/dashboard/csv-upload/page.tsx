"use client";

import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, FileSpreadsheet } from "lucide-react";
interface Batch {
  id: string;
  filename: string;
  createdAt: string;
  status: string;
  processed: number;
  totalRows: number;
}

export default function CsvUploadDashboard() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBatches = async () => {
    try {
      const res = await fetch("/api/csv-batches");
      if (res.ok) {
        const data = await res.json();
        setBatches(data.batches || []);
      }
    } catch (err) {
      console.error("Failed to fetch batches", err);
    }
  };

  useEffect(() => {
    fetchBatches();
    const interval = setInterval(fetchBatches, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (!selectedFile.name.endsWith(".csv")) {
        setStatus("error");
        setErrorMessage("Please select a valid CSV file.");
        return;
      }
      if (selectedFile.size > 5 * 1024 * 1024) {
        setStatus("error");
        setErrorMessage("File exceeds the 5MB size limit.");
        return;
      }
      setFile(selectedFile);
      setStatus("idle");
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload-csv", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to upload file");
      }

      setStatus("success");
      fetchBatches();
      setTimeout(() => {
        setFile(null);
        setStatus("idle");
      }, 4000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setStatus("error");
        setErrorMessage(err.message || "An unexpected error occurred.");
      } else {
        setStatus("error");
        setErrorMessage("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 text-foreground bg-background">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Batch Diagnostics Engine
          </h1>
          <p className="text-muted-foreground text-lg">
            Upload vast datasets to sequentially evaluate bias, toxicity, and compliance at scale.
          </p>
        </div>

        <div className="glass-panel p-8 sm:p-12 rounded-3xl flex flex-col items-center justify-center border-2 border-dashed border-primary/20 hover:border-primary/50 transition-colors bg-card/60 relative overflow-hidden" 
             onDragOver={(e) => e.preventDefault()} 
             onDrop={handleDrop}>
          
          <input
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

          {!file ? (
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="w-20 h-20 bg-primary/10 text-primary flex items-center justify-center rounded-full mb-2 pulse-ring">
                <UploadCloud size={40} />
              </div>
              <h3 className="text-2xl font-bold">Drag and drop your CSV</h3>
              <p className="text-muted-foreground max-w-sm">
                Supported format: .csv up to 5MB.
              </p>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="mt-6 px-8 py-3 bg-primary text-primary-foreground font-semibold rounded-full hover-lift"
              >
                Browse Files
              </button>
            </div>
          ) : (
            <div className="w-full max-w-md mx-auto flex flex-col items-center space-y-6">
              <div className="flex items-center space-x-4 bg-background/50 p-4 rounded-xl border border-border w-full">
                <FileSpreadsheet className="text-secondary w-10 h-10 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg truncate">{file.name}</p>
                  <p className="text-sm text-muted-foreground">{(file.size / 1024).toFixed(1)} KB</p>
                </div>
              </div>

              {status === "error" && (
                <div className="flex items-center space-x-2 text-red-500 bg-red-500/10 p-3 rounded-lg w-full">
                  <AlertCircle size={20} />
                  <span className="text-sm font-medium">{errorMessage}</span>
                </div>
              )}

              {status === "success" && (
                <div className="flex items-center space-x-2 text-green-500 bg-green-500/10 p-3 rounded-lg w-full">
                  <CheckCircle2 size={20} />
                  <span className="text-sm font-medium">Upload successful! Background processing started.</span>
                </div>
              )}

              <div className="flex space-x-4 w-full pt-4">
                <button 
                  onClick={() => { setFile(null); setStatus("idle"); }}
                  disabled={loading}
                  className="flex-1 px-6 py-3 border border-border text-foreground font-semibold rounded-full hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpload}
                  disabled={loading || status === "success"}
                  className="flex-1 flex justify-center items-center px-6 py-3 bg-gradient-to-r from-primary to-accent text-white font-bold rounded-full hover-lift disabled:opacity-50 disabled:transform-none disabled:box-shadow-none"
                >
                  {loading ? <Loader2 className="animate-spin" size={24}/> : "Process Batch"}
                </button>
              </div>

            </div>
          )}
        </div>

        {/* Recent Uploads Section */}
        {batches.length > 0 && (
          <div className="space-y-6 mt-12">
            <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <FileSpreadsheet className="text-primary w-6 h-6" />
              Recent Batch Processes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {batches.map((batch) => (
                <div key={batch.id} className="glass-panel p-5 rounded-2xl flex flex-col space-y-3 relative overflow-hidden group">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-semibold text-foreground truncate max-w-[200px] sm:max-w-xs">{batch.filename}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(batch.createdAt).toLocaleDateString()} at {new Date(batch.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      batch.status === "COMPLETED" ? "bg-green-500/10 text-green-500" :
                      batch.status === "FAILED" ? "bg-red-500/10 text-red-500" :
                      "bg-blue-500/10 text-blue-500 animate-pulse"
                    }`}>
                      {batch.status}
                    </span>
                  </div>
                  
                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs font-medium text-muted-foreground">
                      <span>Progress</span>
                      <span>{batch.processed} / {batch.totalRows} records</span>
                    </div>
                    <div className="h-2 w-full bg-secondary/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500 ease-out"
                        style={{ width: `${batch.totalRows > 0 ? Math.min(100, Math.round((batch.processed / batch.totalRows) * 100)) : 0}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
