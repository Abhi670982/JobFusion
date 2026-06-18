"use client";

import { useState } from "react";
import { Loader2, Upload, AlertCircle, CheckCircle2 } from "lucide-react";

export default function TestUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const uploadFile = async () => {
    setStatus("Upload Started...");
    setResult(null);

    if (!file) {
      setStatus("Error: Please select a file");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload-resume", {
        method: "POST",
        body: formData,
      });

      setStatus(`Status Code: ${res.status}`);
      const data = await res.json();
      console.log(data);
      setResult(data);
    } catch (error) {
      console.error(error);
      setStatus("Error: Upload Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 p-6 max-w-xl mx-auto w-full space-y-6">
      <div className="card-premium p-6 space-y-4">
        <h1 className="text-xl font-bold">Resume Upload Test Tool</h1>
        <p className="text-sm text-muted-foreground">Used for raw API testing of resume file parsing.</p>
        
        <div className="space-y-4">
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 hover:border-primary/40 transition-all">
            <Upload className="w-8 h-8 text-muted-foreground mb-2" />
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setStatus(e.target.files?.[0] ? `Selected: ${e.target.files[0].name}` : "");
              }}
              className="text-xs text-muted-foreground file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
            />
          </div>

          <button
            onClick={() => {
              uploadFile();
            }}
            disabled={loading}
            className="w-full h-10 rounded-xl gradient-brand text-white font-medium flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Upload & Test API
          </button>
        </div>

        {status && (
          <div className="p-3 rounded-xl bg-muted/60 border border-border flex items-center gap-2 text-xs font-semibold">
            {status.startsWith("Error:") ? (
              <AlertCircle className="w-4 h-4 text-destructive" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            )}
            <span>{status}</span>
          </div>
        )}

        {result && (
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">API Response Data</h3>
            <pre className="p-4 rounded-xl bg-slate-950 text-slate-100 text-xs overflow-auto max-h-60 leading-relaxed font-mono">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </main>
  );
}