import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import { toast } from "react-hot-toast";
import {
  Play,
  Sparkles,
  Copy,
  Trash2,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  MessageSquare,
  Table,
  TerminalSquare,
  Check,
} from "lucide-react";

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
}

interface ResultInsight {
  summary: string;
  key_findings: string[];
  anomalies: string[];
  suggested_follow_up: string[];
}

const SAMPLE_QUERIES = [
  { label: "List all tables", sql: "SELECT name, type FROM sqlite_master WHERE type='table' ORDER BY name;" },
  {
    label: "Show translation history",
    sql: "SELECT id, inputText, isHumanToSql, timestamp FROM translations ORDER BY id DESC LIMIT 20;",
  },
  { label: "Count by type", sql: "SELECT isHumanToSql, COUNT(*) as count FROM translations GROUP BY isHumanToSql;" },
  { label: "Recent activity", sql: "SELECT * FROM translations ORDER BY timestamp DESC LIMIT 5;" },
];

export default function PlaygroundPage() {
  const [sql, setSql] = useState("SELECT name, type FROM sqlite_master WHERE type='table' ORDER BY name;");
  const [result, setResult] = useState<QueryResult | null>(null);
  const [insight, setInsight] = useState<ResultInsight | null>(null);
  const [loadingQuery, setLoadingQuery] = useState(false);
  const [loadingInsight, setLoadingInsight] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"results" | "insight">("results");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const runQuery = async () => {
    if (!sql.trim()) return;
    setLoadingQuery(true);
    setResult(null);
    setInsight(null);
    setActiveTab("results");
    try {
      const res = await fetch("/api/run-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      });
      const data = await res.json();
      setResult(data);
      if (data.error) toast.error("Query returned an error.");
      else toast.success(`${data.rows?.length ?? 0} row(s) returned.`);
    } catch (err: any) {
      toast.error(err.message || "Failed to run query.");
    } finally {
      setLoadingQuery(false);
    }
  };

  const getInsight = async () => {
    if (!result || !result.rows || result.rows.length === 0 || result.error) return;
    setLoadingInsight(true);
    setActiveTab("insight");
    try {
      const res = await fetch("/api/analyze-results", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sql, columns: result.columns, rows: result.rows }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setInsight(data);
    } catch (err: any) {
      toast.error(err.message || "Failed to analyse results.");
    } finally {
      setLoadingInsight(false);
    }
  };

  const copySQL = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const clearAll = () => {
    setSql("");
    setResult(null);
    setInsight(null);
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      runQuery();
    }
  };

  const hasResults = result && !result.error && result.rows?.length > 0;

  return (
    <>
      <Head>
        <title>SQL Playground — QueryGen AI</title>
        <meta name="description" content="Write and run SQL queries directly against your local database with AI-powered result insights." />
      </Head>
      <Sidebar />

      <main className="main-content">
        <div className="max-w-container">

          {/* Header */}
          <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <TerminalSquare size={28} style={{ color: "var(--accent-blue)" }} />
                <h1 style={{ margin: 0 }}>SQL Playground</h1>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", margin: 0 }}>
                Run SELECT queries directly against your local SQLite database — with AI result insights.
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                className="btn btn-outline"
                onClick={copySQL}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy SQL</>}
              </button>
              <button
                className="btn btn-outline"
                onClick={clearAll}
                style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--accent-red)" }}
              >
                <Trash2 size={14} /> Clear
              </button>
            </div>
          </header>

          {/* Sample queries */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "16px" }}>
            <span style={{ fontSize: "12px", color: "var(--text-muted)", alignSelf: "center", fontWeight: 500 }}>
              Quick samples:
            </span>
            {SAMPLE_QUERIES.map((q) => (
              <button
                key={q.label}
                className="btn btn-outline"
                onClick={() => { setSql(q.sql); setResult(null); setInsight(null); }}
                style={{ fontSize: "12px", padding: "4px 12px", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <ChevronRight size={12} />
                {q.label}
              </button>
            ))}
          </div>

          {/* Editor */}
          <div className="standard-card" style={{ overflow: "hidden", marginBottom: "24px" }}>
            {/* Code editor header */}
            <div
              style={{
                background: "var(--bg-secondary)",
                borderBottom: "1px solid var(--border-color)",
                padding: "10px 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-red)", opacity: 0.7 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-orange)", opacity: 0.7 }} />
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--accent-green)", opacity: 0.7 }} />
                <span style={{ marginLeft: "8px", fontSize: "12px", color: "var(--text-muted)", fontFamily: "'JetBrains Mono', monospace" }}>
                  query.sql
                </span>
              </div>
              <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Ctrl+Enter to run</span>
            </div>

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              className="dl-textarea"
              value={sql}
              onChange={(e) => setSql(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={8}
              spellCheck={false}
              placeholder="Write your SQL query here…"
              style={{
                border: "none",
                borderRadius: 0,
                resize: "vertical",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "14px",
                lineHeight: "1.8",
                background: "var(--bg-card)",
                color: "var(--code-color)",
                padding: "20px 24px",
                minHeight: "180px",
                width: "100%",
              }}
            />

            {/* Run bar */}
            <div
              style={{
                background: "var(--bg-secondary)",
                borderTop: "1px solid var(--border-color)",
                padding: "12px 16px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                Only SELECT queries are permitted (read-only)
              </span>
              <button
                className="btn btn-primary"
                onClick={runQuery}
                disabled={loadingQuery || !sql.trim()}
                style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 20px" }}
              >
                {loadingQuery ? (
                  <><span className="spinner" /> Running…</>
                ) : (
                  <><Play size={15} /> Run Query</>
                )}
              </button>
            </div>
          </div>

          {/* Results area */}
          {result && (
            <div className="fade-up">
              {/* Tab bar */}
              <div
                style={{
                  display: "flex",
                  gap: "0",
                  marginBottom: "16px",
                  borderBottom: "1px solid var(--border-color)",
                }}
              >
                <button
                  className={`btn ${activeTab === "results" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setActiveTab("results")}
                  style={{
                    borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                    borderBottomColor: activeTab === "results" ? "transparent" : undefined,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                  }}
                >
                  <Table size={14} /> Results
                  {hasResults && (
                    <span
                      style={{
                        background: "var(--accent-green-bg)",
                        color: "var(--accent-green)",
                        borderRadius: "99px",
                        padding: "1px 8px",
                        fontSize: "11px",
                        fontWeight: 600,
                      }}
                    >
                      {result.rows.length}
                    </span>
                  )}
                </button>
                <button
                  className={`btn ${activeTab === "insight" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => {
                    setActiveTab("insight");
                    if (!insight && hasResults) getInsight();
                  }}
                  disabled={!hasResults}
                  style={{
                    borderRadius: "var(--radius-md) var(--radius-md) 0 0",
                    borderBottomColor: activeTab === "insight" ? "transparent" : undefined,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    opacity: !hasResults ? 0.4 : 1,
                  }}
                >
                  <Sparkles size={14} /> AI Insights
                </button>
              </div>

              {/* Results Tab */}
              {activeTab === "results" && (
                <>
                  {result.error ? (
                    <div
                      style={{
                        padding: "20px 24px",
                        border: "1px solid rgba(239,68,68,0.3)",
                        background: "var(--accent-red-bg)",
                        borderRadius: "var(--radius-lg)",
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent-red)", fontWeight: 600 }}>
                        <AlertCircle size={16} /> Query Error
                      </div>
                      <pre
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "13px",
                          color: "var(--accent-red)",
                          whiteSpace: "pre-wrap",
                          background: "rgba(239,68,68,0.05)",
                          padding: "12px",
                          borderRadius: "var(--radius-sm)",
                          margin: 0,
                        }}
                      >
                        {result.error}
                      </pre>
                    </div>
                  ) : result.rows.length === 0 ? (
                    <div className="standard-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-secondary)" }}>
                      <Check size={32} style={{ color: "var(--accent-green)", marginBottom: "12px" }} />
                      <p style={{ margin: 0 }}>Query ran successfully — 0 rows returned.</p>
                    </div>
                  ) : (
                    <>
                      {/* Meta row */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontSize: "13px", color: "var(--accent-green)", fontWeight: 500, display: "flex", alignItems: "center", gap: "6px" }}>
                          <Check size={14} /> {result.rows.length} row{result.rows.length !== 1 ? "s" : ""} &middot; {result.columns.length} column{result.columns.length !== 1 ? "s" : ""}
                        </span>
                        <button
                          className="btn btn-secondary"
                          onClick={getInsight}
                          disabled={loadingInsight}
                          style={{ fontSize: "12px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                        >
                          {loadingInsight ? <><span className="spinner" /> Analysing…</> : <><Sparkles size={13} /> Get AI Insights</>}
                        </button>
                      </div>

                      {/* Table */}
                      <div className="standard-card" style={{ overflow: "hidden" }}>
                        <div style={{ overflowX: "auto", maxHeight: "420px", overflowY: "auto" }}>
                          <table className="dl-table">
                            <thead>
                              <tr>
                                <th style={{ width: "40px", color: "var(--text-muted)", fontWeight: 500 }}>#</th>
                                {result.columns.map((col) => (
                                  <th key={col}>{col}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {result.rows.map((row, ri) => (
                                <tr key={ri}>
                                  <td style={{ color: "var(--text-muted)", fontSize: "11px" }}>{ri + 1}</td>
                                  {result.columns.map((col) => (
                                    <td
                                      key={col}
                                      style={{
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontSize: "13px",
                                        maxWidth: "260px",
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                      }}
                                    >
                                      {row[col] === null ? (
                                        <span style={{ color: "var(--text-muted)", fontStyle: "italic" }}>NULL</span>
                                      ) : (
                                        String(row[col])
                                      )}
                                    </td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* Insight Tab */}
              {activeTab === "insight" && (
                <>
                  {loadingInsight ? (
                    <div
                      className="standard-card"
                      style={{
                        padding: "60px",
                        textAlign: "center",
                        color: "var(--text-secondary)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <span className="spinner" style={{ width: "28px", height: "28px" }} />
                      <p style={{ margin: 0 }}>Analysing your results with AI…</p>
                    </div>
                  ) : insight ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                      {/* Summary card */}
                      <div
                        className="standard-card"
                        style={{
                          padding: "24px",
                          borderLeft: "4px solid var(--accent-blue)",
                          background: "var(--accent-blue-bg)",
                        }}
                      >
                        <div
                          style={{
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "var(--accent-blue)",
                            textTransform: "uppercase",
                            letterSpacing: "0.08em",
                            marginBottom: "10px",
                          }}
                        >
                          Summary
                        </div>
                        <p style={{ margin: 0, color: "var(--text-primary)", lineHeight: 1.7 }}>{insight.summary}</p>
                      </div>

                      {/* Key findings */}
                      {insight.key_findings.length > 0 && (
                        <div className="standard-card" style={{ padding: "24px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "16px",
                              color: "var(--accent-green)",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            <TrendingUp size={16} /> Key Findings
                          </div>
                          <ul style={{ margin: 0, padding: "0 0 0 4px", listStyle: "none", display: "flex", flexDirection: "column", gap: "12px" }}>
                            {insight.key_findings.map((f, i) => (
                              <li
                                key={i}
                                style={{
                                  display: "flex",
                                  gap: "12px",
                                  color: "var(--text-primary)",
                                  lineHeight: 1.6,
                                  fontSize: "14px",
                                  padding: "12px 16px",
                                  background: "var(--bg-secondary)",
                                  borderRadius: "var(--radius-md)",
                                }}
                              >
                                <span
                                  style={{
                                    minWidth: "22px",
                                    height: "22px",
                                    borderRadius: "50%",
                                    background: "var(--accent-green-bg)",
                                    color: "var(--accent-green)",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    marginTop: "1px",
                                  }}
                                >
                                  {i + 1}
                                </span>
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Anomalies */}
                      {insight.anomalies.length > 0 && (
                        <div className="standard-card" style={{ padding: "24px", borderLeft: "4px solid var(--accent-orange)" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "16px",
                              color: "var(--accent-orange)",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            <AlertCircle size={16} /> Anomalies / Data Quality
                          </div>
                          <ul style={{ margin: 0, padding: "0 0 0 16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            {insight.anomalies.map((a, i) => (
                              <li key={i} style={{ color: "var(--text-secondary)", lineHeight: 1.6, fontSize: "14px" }}>
                                {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Follow-up suggestions */}
                      {insight.suggested_follow_up.length > 0 && (
                        <div className="standard-card" style={{ padding: "24px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                              marginBottom: "16px",
                              color: "var(--accent-purple)",
                              fontWeight: 600,
                              fontSize: "14px",
                            }}
                          >
                            <MessageSquare size={16} /> Suggested Follow-up Questions
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {insight.suggested_follow_up.map((q, i) => (
                              <button
                                key={i}
                                className="btn btn-outline"
                                style={{
                                  justifyContent: "flex-start",
                                  textAlign: "left",
                                  whiteSpace: "normal",
                                  height: "auto",
                                  padding: "10px 14px",
                                  gap: "10px",
                                  lineHeight: 1.5,
                                  color: "var(--text-secondary)",
                                  fontSize: "13px",
                                }}
                                onClick={() => {
                                  setSql(`-- ${q}\n`);
                                  setResult(null);
                                  setInsight(null);
                                  setActiveTab("results");
                                  textareaRef.current?.focus();
                                }}
                              >
                                <ChevronRight size={14} style={{ flexShrink: 0, color: "var(--accent-purple)" }} />
                                {q}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div
                      className="standard-card"
                      style={{
                        padding: "60px",
                        textAlign: "center",
                        color: "var(--text-secondary)",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "16px",
                      }}
                    >
                      <Sparkles size={36} style={{ color: "var(--text-muted)" }} />
                      <p style={{ margin: 0 }}>Click <strong>Get AI Insights</strong> to have AI analyse your results.</p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {!result && (
            <div
              className="standard-card"
              style={{
                padding: "64px",
                textAlign: "center",
                color: "var(--text-muted)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "16px",
              }}
            >
              <TerminalSquare size={40} style={{ opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: "15px" }}>
                Write a SQL query above and press <strong>Run Query</strong> or <kbd style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "4px", padding: "1px 6px", fontSize: "12px" }}>Ctrl+Enter</kbd>
              </p>
            </div>
          )}

        </div>
      </main>
    </>
  );
}
