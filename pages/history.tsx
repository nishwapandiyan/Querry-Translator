import React, { useState, useEffect } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import { ClipboardList, RefreshCw, Trash2, Search, Tag, Inbox, Edit2, Download, X, Copy } from "lucide-react";

interface HistoryEntry {
  id: number;
  inputText: string;
  outputText: string;
  tableSchema: string;
  isHumanToSql: number;
  tags: string;
  timestamp: string;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "human_to_sql" | "sql_to_human">("all");
  const [tagFilter, setTagFilter] = useState<string>("");
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const [editingTags, setEditingTags] = useState<{ id: number; value: string } | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/history");
      const data = await res.json();
      setHistory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchHistory(); }, []);

  const deleteEntry = async (id: number) => {
    await fetch(`/api/history?id=${id}`, { method: "DELETE" });
    setHistory(prev => prev.filter(e => e.id !== id));
    if (selectedEntry?.id === id) setSelectedEntry(null);
  };

  const clearAll = async () => {
    if (!confirm("Clear all history? This cannot be undone.")) return;
    await fetch("/api/history", { method: "DELETE" });
    setHistory([]);
    setSelectedEntry(null);
  };

  const saveTags = async (id: number, tags: string) => {
    await fetch(`/api/history?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags }),
    });
    setHistory(prev => prev.map(e => e.id === id ? { ...e, tags } : e));
    if (selectedEntry?.id === id) setSelectedEntry(prev => prev ? { ...prev, tags } : null);
    setEditingTags(null);
  };

  const exportSQL = (entry: HistoryEntry) => {
    const blob = new Blob(
      [`-- Input: ${entry.inputText}\n-- Type: ${entry.isHumanToSql ? "Human → SQL" : "SQL → Human"}\n-- Date: ${new Date(entry.timestamp).toLocaleString()}\n-- Tags: ${entry.tags || "none"}\n\n${entry.outputText}`],
      { type: "text/plain" }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `query_${entry.id}.sql`; a.click();
  };

  const allTags = Array.from(
    new Set(
      history.flatMap(e => (e.tags || "").split(",").map(t => t.trim()).filter(Boolean))
    )
  ).sort();

  const filtered = history.filter(e => {
    const matchSearch = !search || e.inputText.toLowerCase().includes(search.toLowerCase()) || e.outputText.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || (filter === "human_to_sql" && e.isHumanToSql) || (filter === "sql_to_human" && !e.isHumanToSql);
    const matchTag = !tagFilter || (e.tags || "").split(",").map(t => t.trim()).includes(tagFilter);
    return matchSearch && matchFilter && matchTag;
  });

  return (
    <>
      <Head><title>Translation History — QueryGen AI</title></Head>
      <Sidebar />

      <main className="main-content">
        <div className="max-w-container">
          
          {/* Header */}
          <header style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <ClipboardList size={28} style={{ color: "var(--accent-blue)" }} />
                <h1 style={{ margin: 0 }}>Translation History</h1>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "40px", margin: 0 }}>
                {history.length} total entries saved locally
              </p>
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <button className="btn btn-secondary" onClick={fetchHistory} style={{ display: "flex", alignItems: "center", gap: "6px" }}><RefreshCw size={14} /> Refresh</button>
              {history.length > 0 && (
                <button className="btn btn-danger" onClick={clearAll} style={{ display: "flex", alignItems: "center", gap: "6px" }}><Trash2 size={14} /> Clear All</button>
              )}
            </div>
          </header>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "16px", marginBottom: "32px" }}>
            {[
              { label: "Total Translations", value: history.length, color: "var(--text-primary)" },
              { label: "Human → SQL", value: history.filter(e => e.isHumanToSql).length, color: "var(--accent-blue)" },
              { label: "SQL → Human", value: history.filter(e => !e.isHumanToSql).length, color: "var(--accent-purple)" },
            ].map((stat, i) => (
              <div key={i} className="standard-card" style={{ padding: "24px" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", marginTop: "8px", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: "12px", marginBottom: "24px", flexWrap: "wrap", alignItems: "center" }}>
            <div style={{ flex: 1, minWidth: "240px", position: "relative" }}>
              <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
              <input
                className="dl-input"
                placeholder="Search history…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ paddingLeft: "36px" }}
              />
            </div>
            
            <div style={{ display: "flex", background: "var(--bg-secondary)", padding: "4px", borderRadius: "var(--radius-md)" }}>
              {(["all", "human_to_sql", "sql_to_human"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`btn ${filter === f ? "btn-primary" : "btn-outline"}`}
                  style={{ 
                    padding: "6px 16px", 
                    fontSize: "13px", 
                    borderRadius: "var(--radius-sm)",
                    border: "none",
                    boxShadow: filter === f ? "var(--shadow-sm)" : "none"
                  }}
                >
                  {f === "all" ? "All" : f === "human_to_sql" ? "NL→SQL" : "SQL→NL"}
                </button>
              ))}
            </div>

            {allTags.length > 0 && (
              <select
                className="dl-select"
                value={tagFilter}
                onChange={e => setTagFilter(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="">All Tags</option>
                {allTags.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
          </div>

          {/* Main Content Area */}
          <div style={{ display: "grid", gridTemplateColumns: selectedEntry ? "1fr 480px" : "1fr", gap: "24px" }}>
            
            {/* TABLE */}
            <div className="standard-card" style={{ padding: 0, overflow: "hidden", alignSelf: "start" }}>
              {loading ? (
                <div style={{ padding: "80px", textAlign: "center", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                  <span className="spinner" style={{ width: "24px", height: "24px" }} />
                  Loading history…
                </div>
              ) : filtered.length === 0 ? (
                <div style={{ padding: "80px", textAlign: "center", color: "var(--text-secondary)", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <div style={{ marginBottom: "16px", color: "var(--text-muted)" }}><Inbox size={48} /></div>
                  No translations found.
                </div>
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table className="dl-table">
                    <thead>
                      <tr>
                        <th style={{ width: "100px" }}>Type</th>
                        <th>Input</th>
                        <th style={{ width: "160px" }}>Tags</th>
                        <th style={{ width: "140px" }}>Date</th>
                        <th style={{ width: "80px", textAlign: "right" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map(entry => (
                        <tr 
                          key={entry.id} 
                          style={{ cursor: "pointer", background: selectedEntry?.id === entry.id ? "var(--bg-secondary)" : undefined }} 
                          onClick={() => setSelectedEntry(entry)}
                        >
                          <td>
                            <span className={`badge ${entry.isHumanToSql ? "badge-blue" : "badge-purple"}`}>
                              {entry.isHumanToSql ? "NL→SQL" : "SQL→NL"}
                            </span>
                          </td>
                          <td style={{ color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", maxWidth: "300px" }}>
                            <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{entry.inputText}</div>
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            {editingTags?.id === entry.id ? (
                              <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                                <input
                                  className="dl-input"
                                  autoFocus
                                  value={editingTags.value}
                                  onChange={e => setEditingTags({ id: entry.id, value: e.target.value })}
                                  onKeyDown={e => { if (e.key === "Enter") saveTags(entry.id, editingTags.value); if (e.key === "Escape") setEditingTags(null); }}
                                  placeholder="tag1, tag2"
                                  style={{ width: "120px", fontSize: "12px", padding: "4px 8px" }}
                                />
                                <button className="btn btn-primary" style={{ padding: "4px 8px" }} onClick={() => saveTags(entry.id, editingTags.value)}>✓</button>
                              </div>
                            ) : (
                              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center", minHeight: "24px" }}>
                                {entry.tags ? entry.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                                  <span key={t} className="badge badge-default">{t}</span>
                                )) : <span style={{ color: "var(--text-muted)", fontSize: "12px" }}>—</span>}
                                <button
                                  className="btn btn-outline"
                                  style={{ padding: "2px 6px", fontSize: "10px", height: "20px" }}
                                  onClick={() => setEditingTags({ id: entry.id, value: entry.tags || "" })}
                                  title="Edit tags"
                                >
                                  <Edit2 size={10} />
                                </button>
                              </div>
                            )}
                          </td>
                          <td style={{ color: "var(--text-secondary)", fontSize: "12px", whiteSpace: "nowrap" }}>
                            {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }} onClick={e => e.stopPropagation()}>
                              <button className="btn btn-outline" style={{ padding: "4px 8px" }} onClick={() => exportSQL(entry)} title="Export"><Download size={14} /></button>
                              <button className="btn btn-outline" style={{ padding: "4px 8px", color: "var(--accent-red)", borderColor: "var(--border-color)" }} onClick={() => deleteEntry(entry.id)} title="Delete"><Trash2 size={14} /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* DETAIL PANEL (SIDE-SHEET) */}
            {selectedEntry && (
              <div className="standard-card fade-up" style={{ padding: "32px", display: "flex", flexDirection: "column", gap: "24px", height: "fit-content", position: "sticky", top: "32px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span className={`badge ${selectedEntry.isHumanToSql ? "badge-blue" : "badge-purple"}`} style={{ marginBottom: "8px" }}>
                      {selectedEntry.isHumanToSql ? "Human → SQL" : "SQL → Human"}
                    </span>
                    <div style={{ fontSize: "12px", color: "var(--text-secondary)" }}>
                      {new Date(selectedEntry.timestamp).toLocaleString()}
                    </div>
                  </div>
                  <button className="btn btn-outline" onClick={() => setSelectedEntry(null)} style={{ padding: "4px 8px", fontSize: "16px", color: "var(--text-secondary)", border: "none" }}><X size={16} /></button>
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Tags</label>
                  {editingTags?.id === selectedEntry.id ? (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <input
                        className="dl-input"
                        autoFocus
                        value={editingTags.value}
                        onChange={e => setEditingTags({ id: selectedEntry.id, value: e.target.value })}
                        onKeyDown={e => { if (e.key === "Enter") saveTags(selectedEntry.id, editingTags.value); if (e.key === "Escape") setEditingTags(null); }}
                        placeholder="tag1, tag2"
                      />
                      <button className="btn btn-primary" onClick={() => saveTags(selectedEntry.id, editingTags.value)}>Save</button>
                    </div>
                  ) : (
                    <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
                      {selectedEntry.tags ? selectedEntry.tags.split(",").map(t => t.trim()).filter(Boolean).map(t => (
                        <span key={t} className="badge badge-default">{t}</span>
                      )) : <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>No tags</span>}
                      <button className="btn btn-outline" style={{ fontSize: "12px", padding: "4px 10px", display: "flex", alignItems: "center", gap: "4px" }} onClick={() => setEditingTags({ id: selectedEntry.id, value: selectedEntry.tags || "" })}>
                        <Edit2 size={12} /> Edit
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Input</label>
                  <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", fontSize: "13px", color: "var(--text-primary)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.6" }}>
                    {selectedEntry.inputText}
                  </div>
                </div>
                
                <div>
                  <label style={{ fontSize: "12px", color: "var(--text-secondary)", fontWeight: 500, display: "block", marginBottom: "8px" }}>Output</label>
                  <pre style={{ background: "var(--code-bg)", border: "1px solid var(--border-color)", borderRadius: "var(--radius-md)", padding: "16px", fontSize: "13px", fontFamily: "'JetBrains Mono', monospace", color: "var(--code-color)", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.6", margin: 0 }}>
                    {selectedEntry.outputText}
                  </pre>
                </div>
                
                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button className="btn btn-primary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={() => navigator.clipboard.writeText(selectedEntry.outputText)}><Copy size={14} /> Copy Output</button>
                  <button className="btn btn-secondary" style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} onClick={() => exportSQL(selectedEntry)}><Download size={14} /> Export .sql</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
