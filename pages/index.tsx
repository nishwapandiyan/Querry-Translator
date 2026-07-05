import React, { useEffect, useState } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import SchemaBuilder from "../components/SchemaBuilder";
import QueryResultTable from "../components/QueryResultTable";
import { useTranslate, Dialect } from "../hooks/useTranslate";
import { toast } from "react-hot-toast";
import ExecutionPlanTree from "../components/ExecutionPlanTree";
import { ExplainPlanRow } from "./api/explain-plan";
import { Zap, MessageSquare, Database, FileText, Wrench, Check, Copy, Search, Play, BarChart2, Sparkles, AlertTriangle, Pin } from "lucide-react";

interface ExplainData {
  summary: string;
  clauses: { clause: string; explanation: string }[];
  complexity: string;
  performance_tips: string[];
  potential_issues: string[];
  static_warnings: string[];
}

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
}

const DIALECTS: Dialect[] = ["PostgreSQL", "MySQL", "SQLite", "BigQuery"];

export default function Home() {
  const { translate, translating, outputText, setOutputText, translationError } = useTranslate();
  const [inputText, setInputText] = useState("");
  const [isHumanToSql, setIsHumanToSql] = useState(true);
  const [tableSchema, setTableSchema] = useState("");
  const [schemaMode, setSchemaMode] = useState<"none" | "manual" | "builder">("none");
  const [isUpperCase, setIsUpperCase] = useState(false);
  const [explaining, setExplaining] = useState(false);
  const [explainData, setExplainData] = useState<ExplainData | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dialect, setDialect] = useState<Dialect>("PostgreSQL");
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [runningQuery, setRunningQuery] = useState(false);
  const [planData, setPlanData] = useState<ExplainPlanRow[] | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => {
    if (translationError) toast.error(translationError);
  }, [translationError]);

  if (!mounted) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    if (!isHumanToSql) {
      const sqlPattern = /^\s*(select|insert|update|delete|create|alter|drop|truncate|grant|revoke|use|begin|commit|rollback)\s/i;
      if (!sqlPattern.test(inputText)) {
        toast.error("Please enter a valid SQL statement.");
        return;
      }
    }
    setExplainData(null);
    setQueryResult(null);
    setPlanData(null);
    translate({ inputText, tableSchema, isHumanToSql, dialect });
  };

  const handleExplain = async () => {
    const queryToExplain = isHumanToSql ? outputText : inputText;
    if (!queryToExplain) { toast.error("Generate a SQL query first."); return; }
    setExplaining(true);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: queryToExplain }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setExplainData(data);
    } catch (err: any) {
      toast.error(err.message || "Explain failed");
    } finally {
      setExplaining(false);
    }
  };

  const handleRunQuery = async () => {
    const sql = isHumanToSql ? outputText : inputText;
    if (!sql) { toast.error("Generate a SQL query first."); return; }
    setRunningQuery(true);
    setQueryResult(null);
    try {
      const res = await fetch("/api/run-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      });
      const data = await res.json();
      setQueryResult(data);
    } catch (err: any) {
      setQueryResult({ columns: [], rows: [], error: err.message });
    } finally {
      setRunningQuery(false);
    }
  };

  const handleExplainPlan = async () => {
    const sql = isHumanToSql ? outputText : inputText;
    if (!sql) { toast.error("Generate a SQL query first."); return; }
    setLoadingPlan(true);
    setPlanData(null);
    try {
      const res = await fetch("/api/explain-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setPlanData(data.plan);
    } catch (err: any) {
      toast.error(err.message || "Failed to fetch execution plan");
    } finally {
      setLoadingPlan(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isUpperCase ? outputText.toUpperCase() : outputText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const displayOutput = outputText
    ? isUpperCase ? outputText.toUpperCase() : outputText
    : isHumanToSql
      ? `SELECT * FROM cars\nWHERE color = 'red'`
      : "Show all cars that are red";

  const complexityColor: Record<string, string> = {
    Simple: "badge-green",
    Moderate: "badge-orange",
    Complex: "badge-red",
  };

  return (
    <>
      <Head>
        <title>QueryGen AI — AI SQL Translator</title>
        <meta name="description" content="Translate natural language to SQL and SQL to plain English using Google Gemini AI." />
      </Head>
      <Sidebar />

      <main className="main-content">
        <div className="max-w-container">
          
          {/* Header */}
          <header style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Zap size={32} style={{ color: "var(--accent-primary)" }} />
              <h1 className="text-gradient">SQL Translator</h1>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginLeft: "40px" }}>
              Translate between Natural Language ↔ SQL with AI precision
            </p>
          </header>

          {/* Mode & Dialect Controls */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "16px", marginBottom: "24px", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => { setIsHumanToSql(true); setOutputText(""); setExplainData(null); setQueryResult(null); }}
                className={`btn ${isHumanToSql ? "btn-primary" : "btn-secondary"}`}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <MessageSquare size={16} /> Natural Language → SQL
              </button>
              <button
                onClick={() => { setIsHumanToSql(false); setOutputText(""); setExplainData(null); setQueryResult(null); }}
                className={`btn ${!isHumanToSql ? "btn-primary" : "btn-secondary"}`}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Database size={16} /> SQL → Natural Language
              </button>
            </div>

            {isHumanToSql && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "13px", color: "var(--text-secondary)", fontWeight: 500 }}>Dialect:</span>
                <div style={{ display: "flex", background: "var(--bg-secondary)", padding: "4px", borderRadius: "var(--radius-md)" }}>
                  {DIALECTS.map(d => (
                    <button
                      key={d}
                      onClick={() => setDialect(d)}
                      className={`btn ${dialect === d ? "btn-primary" : "btn-outline"}`}
                      style={{ 
                        padding: "4px 12px", 
                        fontSize: "12px", 
                        borderRadius: "var(--radius-sm)",
                        border: "none",
                        boxShadow: dialect === d ? "var(--shadow-sm)" : "none"
                      }}
                      title={d}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <Database size={12} /> {d}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px", alignItems: "stretch" }}>
              
              {/* INPUT PANEL */}
              <div className="standard-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {isHumanToSql ? "Natural Language" : "SQL Query"}
                  </label>
                  <span className={`badge ${isHumanToSql ? "badge-orange" : "badge-blue"}`}>
                    Input
                  </span>
                </div>
                
                <textarea
                  className="dl-textarea"
                  rows={8}
                  placeholder={
                    isHumanToSql
                      ? "e.g. Show me all customers older than 25 who made a purchase last month"
                      : "e.g. SELECT * FROM customers WHERE age > 25"
                  }
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit(); }}
                  style={{ flex: 1, minHeight: "200px" }}
                />

                {/* Temporarily hidden Schema Builder and Manual Schema */}
                {/*
                {isHumanToSql && (
                  <div style={{ marginTop: "16px", display: "flex", gap: "8px" }}>
                    <button type="button" className={`btn ${schemaMode === "manual" ? "btn-secondary" : "btn-outline"}`} style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setSchemaMode(schemaMode === "manual" ? "none" : "manual")}>
                      <FileText size={16} /> Manual Schema
                    </button>
                    <button type="button" className={`btn ${schemaMode === "builder" ? "btn-secondary" : "btn-outline"}`} style={{ display: "flex", alignItems: "center", gap: "6px" }} onClick={() => setSchemaMode(schemaMode === "builder" ? "none" : "builder")}>
                      <Wrench size={16} /> Schema Builder
                    </button>
                  </div>
                )}

                {schemaMode === "manual" && isHumanToSql && (
                  <div style={{ marginTop: "16px" }}>
                    <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Table Schema (CREATE TABLE …)</label>
                    <textarea className="dl-textarea" rows={4} placeholder="CREATE TABLE customers (id INT, name VARCHAR(255), age INT, ...);" value={tableSchema} onChange={e => setTableSchema(e.target.value)} />
                  </div>
                )}
                */}
              </div>

              {/* OUTPUT PANEL */}
              <div className="standard-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
                  <label style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-primary)" }}>
                    {isHumanToSql ? `SQL Output (${dialect})` : "Natural Language"}
                  </label>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    {isHumanToSql && outputText && (
                      <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", cursor: "pointer" }}>
                        <input type="checkbox" checked={isUpperCase} onChange={e => setIsUpperCase(e.target.checked)} />
                        UPPERCASE
                      </label>
                    )}
                    <span className={`badge ${isHumanToSql ? "badge-green" : "badge-purple"}`}>
                      Output
                    </span>
                  </div>
                </div>

                <div style={{ 
                  flex: 1,
                  background: "var(--code-bg)", 
                  border: "1px solid var(--border-color)", 
                  borderRadius: "var(--radius-md)",
                  position: "relative",
                  overflow: "hidden"
                }}>
                  {outputText && (
                    <div style={{ 
                      background: "var(--code-header-bg)", 
                      padding: "8px 16px", 
                      borderBottom: "1px solid var(--border-color)",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}>
                      <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        {isHumanToSql ? 'sql' : 'text'}
                      </span>
                      <button type="button" onClick={handleCopy} style={{ background: "none", border: "none", color: "var(--text-secondary)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                        {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy</>}
                      </button>
                    </div>
                  )}
                  <pre style={{ 
                    padding: "16px", 
                    margin: 0,
                    minHeight: outputText ? "160px" : "200px", 
                    fontFamily: "'JetBrains Mono', monospace", 
                    fontSize: "13px", 
                    color: outputText ? "var(--code-color)" : "var(--text-muted)", 
                    whiteSpace: "pre-wrap", 
                    wordBreak: "break-word",
                    overflow: "auto" 
                  }}>
                    {displayOutput}
                  </pre>
                </div>

                {outputText && (
                  <div style={{ display: "flex", gap: "8px", marginTop: "16px", flexWrap: "wrap" }}>
                    <button type="button" className="btn btn-outline" onClick={handleExplain} disabled={explaining} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {explaining ? <><span className="spinner" style={{ width: "12px", height: "12px", borderWidth: "1px" }}/> Analyzing…</> : <><Search size={14} /> Explain Query</>}
                    </button>
                    {isHumanToSql && (
                      <button type="button" className="btn btn-secondary" onClick={handleRunQuery} disabled={runningQuery} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        {runningQuery ? <><span className="spinner" style={{ width: "12px", height: "12px", borderWidth: "1px" }}/> Running…</> : <><Play size={14} /> Run Query</>}
                      </button>
                    )}
                    <button type="button" className="btn btn-outline" onClick={handleExplainPlan} disabled={loadingPlan} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      {loadingPlan ? <><span className="spinner" style={{ width: "12px", height: "12px", borderWidth: "1px" }}/> Fetching Plan…</> : <><BarChart2 size={14} /> View Execution Plan</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Schema Builder Area */}
            {schemaMode === "builder" && isHumanToSql && (
              <div className="standard-card fade-up" style={{ padding: "24px", marginBottom: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "24px" }}>
                  <Wrench size={20} />
                  <h3 style={{ margin: 0 }}>Schema Builder</h3>
                  <span className="badge badge-default">Auto-generate CREATE TABLE</span>
                </div>
                <SchemaBuilder onSchemaChange={setTableSchema} />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button type="submit" className="btn btn-primary" disabled={translating || !inputText.trim()} style={{ padding: "12px 32px", fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                {translating ? (
                  <><span className="spinner"/> Translating…</>
                ) : (
                  <><Sparkles size={16} /> {isHumanToSql ? "Generate SQL" : "Generate Natural Language"}</>
                )}
              </button>
            </div>
          </form>

          {/* Query Results */}
          {(queryResult || runningQuery) && (
            <div className="fade-up" style={{ marginTop: "32px" }}>
              <QueryResultTable
                result={queryResult || { columns: [], rows: [] }}
                sql={outputText}
                loading={runningQuery}
                onFix={(sql, error) => {
                  toast("Send the query to AI SQL Agent to fix it →");
                }}
              />
            </div>
          )}

          {/* Execution Plan Tree */}
          {planData && (
            <div className="fade-up" style={{ marginTop: "32px" }}>
              <ExecutionPlanTree plan={planData} />
            </div>
          )}

          {/* Explain Panel */}
          {explainData && (
            <div className="standard-card fade-up" style={{ padding: "32px", marginTop: "32px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <Search size={24} />
                <h2 style={{ margin: 0 }}>Query Analysis</h2>
                {explainData.complexity && (
                  <span className={`badge ${complexityColor[explainData.complexity] || "badge-default"}`}>
                    {explainData.complexity}
                  </span>
                )}
              </div>

              {explainData.static_warnings?.length > 0 && (
                <div style={{ background: "var(--accent-orange-bg)", border: "1px solid rgba(245,158,11,0.2)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: "24px" }}>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "var(--accent-orange)", textTransform: "uppercase", letterSpacing: "0.02em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <AlertTriangle size={16} /> Static Analysis Warnings
                  </div>
                  {explainData.static_warnings.map((w, i) => (
                    <div key={i} style={{ display: "flex", gap: "8px", fontSize: "14px", color: "var(--text-primary)", marginBottom: "8px", lineHeight: "1.5" }}>
                      <span style={{ flexShrink: 0, color: "var(--accent-orange)" }}>•</span>
                      <span>{w}</span>
                    </div>
                  ))}
                </div>
              )}

              {explainData.summary && (
                <div style={{ background: "var(--bg-secondary)", borderRadius: "var(--radius-md)", padding: "16px 20px", marginBottom: "24px", fontSize: "15px", color: "var(--text-primary)", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <Pin size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
                  <div>{explainData.summary}</div>
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                {explainData.clauses?.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "16px" }}>Clause Breakdown</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {explainData.clauses.map((c, i) => (
                        <div key={i} style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
                          <span style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", color: "var(--text-primary)", padding: "2px 6px", borderRadius: "4px", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", fontWeight: 500, flexShrink: 0 }}>
                            {c.clause}
                          </span>
                          <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{c.explanation}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  {explainData.performance_tips?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><Zap size={14} /> Performance Tips</h3>
                      {explainData.performance_tips.map((t, i) => (
                        <div key={i} style={{ fontSize: "14px", color: "var(--text-secondary)", display: "flex", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ color: "var(--accent-green)" }}>•</span>{t}
                        </div>
                      ))}
                    </div>
                  )}
                  {explainData.potential_issues?.length > 0 && (
                    <div>
                      <h3 style={{ fontSize: "13px", color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px" }}><AlertTriangle size={14} /> Potential Issues</h3>
                      {explainData.potential_issues.map((t, i) => (
                        <div key={i} style={{ fontSize: "14px", color: "var(--text-primary)", display: "flex", gap: "8px", marginBottom: "8px" }}>
                          <span style={{ color: "var(--accent-orange)" }}>•</span>{t}
                        </div>
                      ))}
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
