import React, { useState } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import { OptimizationResult } from "../src/optimizerAgent";
import { toast } from "react-hot-toast";
import { Rocket, Copy, Zap, BookOpen, AlertTriangle } from "lucide-react";

export default function OptimizerPage() {
  const [originalSql, setOriginalSql] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<OptimizationResult | null>(null);

  const handleOptimize = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!originalSql.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: originalSql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setResult(data);
    } catch (err: any) {
      toast.error(err.message || "Optimization failed");
    } finally {
      setLoading(false);
    }
  };

  const getComplexityBadge = (complexity: string) => {
    switch (complexity) {
      case "Simple": return "badge-green";
      case "Moderate": return "badge-orange";
      case "Complex": return "badge-red";
      default: return "badge-default";
    }
  };

  return (
    <>
      <Head>
        <title>AI Query Optimizer — QueryGen AI</title>
      </Head>
      <Sidebar />

      <main className="main-content">
        <div className="max-w-container">
          
          {/* Header */}
          <header style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Rocket size={28} style={{ color: "var(--accent-blue)" }} />
              <h1>AI Query Optimizer</h1>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginLeft: "40px" }}>
              Analyze and rewrite SQL for maximum performance and readability.
            </p>
          </header>

          <form onSubmit={handleOptimize} style={{ marginBottom: "48px" }}>
            <div className="standard-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                  Original SQL Query
                </label>
              </div>
              <textarea
                className="dl-textarea"
                rows={6}
                placeholder="Paste your slow or unoptimized SQL query here..."
                value={originalSql}
                onChange={e => setOriginalSql(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleOptimize(); }}
                style={{ minHeight: "150px", marginBottom: "24px" }}
              />
              
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || !originalSql.trim()} 
                  style={{ padding: "12px 24px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {loading ? (
                    <><span className="spinner"/> Analyzing…</>
                  ) : (
                    <><Rocket size={16} /> Optimize Query</>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Results Area */}
          {result && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              
              {/* Comparison Section */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "stretch" }}>
                
                {/* Original View */}
                <div className="standard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                  <div style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Original SQL</span>
                  </div>
                  <pre style={{ 
                    padding: "16px", margin: 0, flex: 1,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", 
                    color: "var(--text-muted)", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    background: "var(--bg-card)" 
                  }}>
                    {originalSql}
                  </pre>
                </div>

                {/* Optimized View */}
                <div className="standard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden", borderColor: "var(--accent-green)", boxShadow: "0 0 0 1px rgba(16,185,129,0.1)" }}>
                  <div style={{ background: "var(--accent-green-bg)", padding: "12px 16px", borderBottom: "1px solid rgba(16,185,129,0.2)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--accent-green)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Optimized SQL</span>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(result.optimized_sql);
                        toast.success("Copied to clipboard!");
                      }} 
                      style={{ background: "none", border: "none", color: "var(--accent-green)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Copy size={12} /> Copy
                    </button>
                  </div>
                  <pre style={{ 
                    padding: "16px", margin: 0, flex: 1,
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", 
                    color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word",
                    background: "var(--bg-card)" 
                  }}>
                    {result.optimized_sql}
                  </pre>
                </div>
              </div>

              {/* Analysis Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
                
                {/* Left Column: Why & Performance */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div className="standard-card" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                      <Zap size={20} />
                      <h3 style={{ margin: 0 }}>Why it's faster</h3>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "14px", lineHeight: "1.6", margin: 0 }}>
                      {result.explanation}
                    </p>
                  </div>

                  <div className="standard-card" style={{ padding: "24px" }}>
                    <h3 style={{ margin: 0, marginBottom: "16px", fontSize: "14px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Performance Profile</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Estimated Gain</div>
                        <div style={{ fontSize: "14px", fontWeight: 500, color: "var(--text-primary)" }}>{result.estimated_performance_gain}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "4px" }}>Query Complexity</div>
                        <span className={`badge ${getComplexityBadge(result.complexity)}`}>{result.complexity}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Indexes & Issues */}
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {result.index_suggestions.length > 0 && (
                    <div className="standard-card" style={{ padding: "24px", borderColor: "rgba(59,130,246,0.3)", background: "var(--accent-blue-bg)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <BookOpen size={20} />
                        <h3 style={{ margin: 0, color: "var(--accent-blue)" }}>Index Suggestions</h3>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {result.index_suggestions.map((idx, i) => (
                          <div key={i} style={{ background: "var(--bg-card)", padding: "12px", borderRadius: "var(--radius-sm)", border: "1px solid rgba(59,130,246,0.2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "var(--text-primary)" }}>
                            {idx}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.potential_issues.length > 0 && (
                    <div className="standard-card" style={{ padding: "24px", borderColor: "rgba(245,158,11,0.3)", background: "var(--accent-orange-bg)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                        <AlertTriangle size={20} style={{ color: "var(--accent-orange)" }} />
                        <h3 style={{ margin: 0, color: "var(--accent-orange)" }}>Potential Issues & Caveats</h3>
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-primary)", fontSize: "14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                        {result.potential_issues.map((issue, i) => (
                          <li key={i}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
