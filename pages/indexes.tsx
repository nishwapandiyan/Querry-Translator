import React, { useState } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import { toast } from "react-hot-toast";
import { IndexRecommendation } from "../src/indexRecommenderAgent";
import { BookOpen, Target, Inbox, Copy } from "lucide-react";

export default function IndexesPage() {
  const [loading, setLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<IndexRecommendation[] | null>(null);

  const analyzeWorkload = async () => {
    setLoading(true);
    setRecommendations(null);

    try {
      const res = await fetch("/api/recommend-indexes", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      if (data.length === 0) {
        toast.error("No recent query history found. Try translating some queries first.");
      }
      
      setRecommendations(data);
    } catch (err: any) {
      toast.error(err.message || "Analysis failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  const getImprovementBadge = (level: string) => {
    switch (level) {
      case "High": return "badge-green";
      case "Medium": return "badge-orange";
      case "Low": return "badge-default";
      default: return "badge-default";
    }
  };

  return (
    <>
      <Head>
        <title>Index Advisor — QueryGen AI</title>
      </Head>
      <Sidebar />

      <main className="main-content">
        <div className="max-w-container">
          
          {/* Header */}
          <header style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <BookOpen size={28} style={{ color: "var(--accent-blue)" }} />
              <h1>Index Advisor</h1>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginLeft: "40px", maxWidth: "800px" }}>
              AI analyzes your recent execution history to recommend optimal database indexing strategies.
              Discover missing composite or covering indexes to massively speed up your workload.
            </p>
          </header>

          <div style={{ marginBottom: "48px", display: "flex", justifyContent: "flex-start" }}>
            <button 
              className="btn btn-primary" 
              onClick={analyzeWorkload}
              disabled={loading}
              style={{ padding: "12px 24px", fontSize: "15px" }}
            >
              {loading ? (
                <><span className="spinner"/> Analyzing Recent Workload…</>
              ) : (
                <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Target size={16} /> Analyze Recent Workload</span>
              )}
            </button>
          </div>

          {recommendations && recommendations.length === 0 && !loading && (
            <div className="standard-card" style={{ padding: "48px", textAlign: "center", color: "var(--text-muted)", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <Inbox size={48} style={{ marginBottom: "16px" }} />
              <p>No recent queries found to analyze.</p>
              <p style={{ fontSize: "14px" }}>Generate some SQL translations first so the AI can understand your workload.</p>
            </div>
          )}

          {/* Results Area */}
          {recommendations && recommendations.length > 0 && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <h2 style={{ fontSize: "18px", marginBottom: "8px" }}>Recommended Indexing Strategy</h2>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
                {recommendations.map((rec, i) => (
                  <div key={i} className="standard-card" style={{ padding: "24px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    {/* Top Row: Expected Benefit & Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "var(--text-primary)" }}>{rec.expected_benefit}</h3>
                        <p style={{ margin: 0, fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                          {rec.why}
                        </p>
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                        <span style={{ fontSize: "12px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Improvement</span>
                        <span className={`badge ${getImprovementBadge(rec.estimated_improvement)}`}>
                          {rec.estimated_improvement}
                        </span>
                      </div>
                    </div>

                    {/* CREATE INDEX Code Block */}
                    <div style={{ 
                      background: "var(--code-bg)", 
                      borderRadius: "var(--radius-sm)", 
                      border: "1px solid var(--border-color)",
                      overflow: "hidden",
                      marginTop: "8px"
                    }}>
                      <div style={{ 
                        background: "var(--code-header-bg)", 
                        padding: "8px 16px", 
                        borderBottom: "1px solid var(--border-color)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}>
                        <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                          sql
                        </span>
                        <button 
                          onClick={() => copyToClipboard(rec.create_statement)}
                          style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px", fontWeight: 600 }}
                        >
                          <Copy size={12} /> Copy Script
                        </button>
                      </div>
                      <pre style={{ 
                        padding: "16px", 
                        margin: 0, 
                        fontFamily: "'JetBrains Mono', monospace", 
                        fontSize: "13px", 
                        color: "var(--code-color)", 
                        whiteSpace: "pre-wrap", 
                        wordBreak: "break-word"
                      }}>
                        {rec.create_statement}
                      </pre>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
