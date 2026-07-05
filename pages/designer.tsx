import React, { useState } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import { toast } from "react-hot-toast";
import { DatabaseSchema, DBTable, DBColumn } from "../src/designerAgent";
import { Database, Sparkles, BarChart2, Code2, Key, Link as LinkIcon, Copy } from "lucide-react";

export default function DesignerPage() {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<DatabaseSchema | null>(null);
  const [activeTab, setActiveTab] = useState<"visualizer" | "sql">("visualizer");

  const handleDesign = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!prompt.trim()) return;

    setLoading(true);
    setSchema(null);

    try {
      const res = await fetch("/api/design-db", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      
      setSchema(data);
    } catch (err: any) {
      toast.error(err.message || "Design generation failed");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard!");
  };

  return (
    <>
      <Head>
        <title>Database Designer — QueryGen AI</title>
      </Head>
      <Sidebar />

      <main className="main-content">
        <div className="max-w-container">
          
          <header style={{ marginBottom: "48px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <Database size={28} style={{ color: "var(--accent-blue)" }} />
              <h1>Database Designer</h1>
            </div>
            <p style={{ color: "var(--text-secondary)", fontSize: "16px", marginLeft: "40px", maxWidth: "800px" }}>
              Describe your software system in plain English and let AI architect a complete relational database schema.
            </p>
          </header>

          <form onSubmit={handleDesign} style={{ marginBottom: "48px" }}>
            <div className="standard-card" style={{ padding: "24px", display: "flex", flexDirection: "column" }}>
              <label style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)", marginBottom: "16px" }}>
                System Description
              </label>
              <textarea
                className="dl-textarea"
                rows={4}
                placeholder="e.g. A hospital management system with doctors, patients, appointments, and billing..."
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleDesign(); }}
                style={{ marginBottom: "24px" }}
              />
              
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={loading || !prompt.trim()} 
                  style={{ padding: "12px 24px", fontSize: "14px", display: "flex", alignItems: "center", gap: "6px" }}
                >
                  {loading ? (
                    <><span className="spinner"/> Architecting Schema…</>
                  ) : (
                    <><Sparkles size={16} /> Generate Schema</>
                  )}
                </button>
              </div>
            </div>
          </form>

          {/* Results Area */}
          {schema && (
            <div className="fade-up" style={{ display: "flex", flexDirection: "column" }}>
              
              {/* Tabs */}
              <div style={{ display: "flex", gap: "16px", marginBottom: "24px", borderBottom: "1px solid var(--border-color)", paddingBottom: "16px" }}>
                <button
                  className={`btn ${activeTab === "visualizer" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setActiveTab("visualizer")}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <BarChart2 size={16} /> Visualizer
                </button>
                <button
                  className={`btn ${activeTab === "sql" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setActiveTab("sql")}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Code2 size={16} /> SQL Scripts
                </button>
              </div>

              {/* Visualizer Tab */}
              {activeTab === "visualizer" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
                  <div className="standard-card" style={{ padding: "24px", background: "var(--bg-secondary)" }}>
                    <h3 style={{ margin: "0 0 8px 0", fontSize: "16px" }}>Relationships Overview</h3>
                    <p style={{ margin: 0, color: "var(--text-secondary)", lineHeight: 1.5, fontSize: "14px" }}>
                      {schema.relationships}
                    </p>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                    {schema.tables.map((table: DBTable, i: number) => (
                      <div key={i} className="standard-card" style={{ overflow: "hidden" }}>
                        <div style={{ background: "var(--bg-secondary)", padding: "16px", borderBottom: "1px solid var(--border-color)" }}>
                          <h3 style={{ margin: "0 0 4px 0", fontSize: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <Database size={16} /> {table.name}
                          </h3>
                          <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>{table.description}</p>
                        </div>
                        <div style={{ padding: "0" }}>
                          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                            <tbody>
                              {table.columns.map((col: DBColumn, j: number) => (
                                <tr key={j} style={{ borderBottom: "1px solid var(--border-color)" }}>
                                  <td style={{ padding: "10px 16px", fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, color: col.isPrimaryKey ? "var(--accent-blue)" : "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                                    {col.name} {col.isPrimaryKey && <Key size={12} />} {col.isForeignKey && <LinkIcon size={12} />}
                                  </td>
                                  <td style={{ padding: "10px 16px", color: "var(--text-secondary)", textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: "12px" }}>
                                    {col.type}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* SQL Scripts Tab */}
              {activeTab === "sql" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "32px" }}>
                  <div className="standard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>CREATE TABLE Scripts</span>
                      <button 
                        onClick={() => copyToClipboard(schema.create_statements)}
                        style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Copy size={12} /> Copy CREATE Scripts
                      </button>
                    </div>
                    <textarea 
                      className="dl-textarea"
                      style={{ 
                        padding: "16px", margin: 0, 
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", 
                        color: "var(--code-color)", background: "var(--bg-card)",
                        border: "none", minHeight: "300px", borderRadius: 0
                      }}
                      defaultValue={schema.create_statements}
                    />
                  </div>

                  <div className="standard-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
                    <div style={{ background: "var(--bg-secondary)", padding: "12px 16px", borderBottom: "1px solid var(--border-color)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Sample Data (INSERT Scripts)</span>
                      <button 
                        onClick={() => copyToClipboard(schema.sample_data_statements)}
                        style={{ background: "none", border: "none", color: "var(--accent-blue)", cursor: "pointer", fontSize: "12px", display: "flex", alignItems: "center", gap: "4px" }}
                      >
                        <Copy size={12} /> Copy INSERT Scripts
                      </button>
                    </div>
                    <textarea 
                      className="dl-textarea"
                      style={{ 
                        padding: "16px", margin: 0, 
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", 
                        color: "var(--code-color)", background: "var(--bg-card)",
                        border: "none", minHeight: "300px", borderRadius: 0
                      }}
                      defaultValue={schema.sample_data_statements}
                    />
                  </div>
                </div>
              )}

            </div>
          )}

        </div>
      </main>
    </>
  );
}
