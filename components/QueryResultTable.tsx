import React from "react";
import { AlertTriangle, Wrench, Check } from "lucide-react";

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
}

interface Props {
  result: QueryResult;
  sql: string;
  loading: boolean;
  onFix: (sql: string, error: string) => void;
}

export default function QueryResultTable({ result, sql, loading, onFix }: Props) {
  if (loading) {
    return (
      <div
        className="standard-card"
        style={{ padding: "16px 24px", fontSize: "14px", color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: "12px" }}
      >
        <span className="spinner" />
        Running query…
      </div>
    );
  }

  if (result.error) {
    return (
      <div
        style={{
          padding: "16px 24px",
          border: "1px solid rgba(239,68,68,0.3)",
          background: "var(--accent-red-bg)",
          borderRadius: "var(--radius-lg)",
        }}
      >
        <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--accent-red)", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertTriangle size={14} /> Query Error
        </div>
        <pre
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            color: "var(--accent-red)",
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            marginBottom: "16px",
            background: "rgba(239,68,68,0.05)",
            padding: "12px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(239,68,68,0.1)"
          }}
        >
          {result.error}
        </pre>
        {sql && (
          <button
            className="btn btn-outline"
            style={{ color: "var(--accent-orange)", borderColor: "rgba(245,158,11,0.3)", background: "var(--bg-card)", display: "flex", alignItems: "center", gap: "6px" }}
            onClick={() => onFix(sql, result.error!)}
          >
            <Wrench size={14} /> Fix it with AI
          </button>
        )}
      </div>
    );
  }

  if (result.rows.length === 0) {
    return (
      <div
        className="standard-card"
        style={{ padding: "16px 24px", fontSize: "14px", color: "var(--text-secondary)", display: "flex", alignItems: "center" }}
      >
        <Check size={16} style={{ color: "var(--accent-green)", marginRight: "8px" }} /> 
        Query ran successfully — 0 rows returned.
      </div>
    );
  }

  return (
    <div
      className="standard-card"
      style={{ overflow: "hidden", maxHeight: "400px", display: "flex", flexDirection: "column" }}
    >
      <div
        style={{
          padding: "12px 24px",
          borderBottom: "1px solid var(--border-color)",
          fontSize: "13px",
          color: "var(--text-secondary)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "var(--bg-secondary)",
        }}
      >
        <span style={{ fontWeight: 500, color: "var(--accent-green)", display: "flex", alignItems: "center" }}>
          <Check size={14} style={{ marginRight: "4px" }} /> {result.rows.length} row{result.rows.length !== 1 ? "s" : ""} returned
        </span>
        <span>{result.columns.length} columns</span>
      </div>
      <div style={{ overflowX: "auto", overflowY: "auto", flex: 1 }}>
        <table className="dl-table">
          <thead>
            <tr>
              {result.columns.map((col) => (
                <th key={col}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.rows.map((row, ri) => (
              <tr key={ri}>
                {result.columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "13px",
                      maxWidth: "250px",
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
  );
}
