import React, { useState, useRef, useEffect } from "react";
import Head from "next/head";
import Sidebar from "../components/Sidebar";
import QueryResultTable from "../components/QueryResultTable";
import { Play, Bot, User, Trash2, AlertTriangle } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface QueryResult {
  columns: string[];
  rows: Record<string, unknown>[];
  error?: string;
  fixedQuery?: string;
}

const SUGGESTED_PROMPTS = [
  "How do I write a JOIN query between two tables?",
  "Explain what GROUP BY and HAVING do",
  "How do I optimize a slow SQL query?",
  "Write a query to find duplicate rows in a table",
  "What's the difference between INNER JOIN and LEFT JOIN?",
];

function extractSQL(content: string): string | null {
  const match = content.match(/```sql\n?([\s\S]*?)```/i);
  return match ? match[1].trim() : null;
}

function MarkdownMessage({
  content,
  onRunQuery,
}: {
  content: string;
  onRunQuery: (sql: string) => void;
}) {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
      {parts.map((part, i) => {
        if (part.startsWith("```")) {
          const langMatch = part.match(/```(\w*)\n?/);
          const lang = langMatch?.[1] || "";
          const code = part.replace(/```\w*\n?/, "").replace(/```$/, "").trim();
          const isSql = lang.toLowerCase() === "sql";
          return (
            <div key={i} style={{ margin: "8px 0", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border-color)" }}>
              {lang && (
                <div
                  style={{
                    background: "var(--code-header-bg)",
                    padding: "6px 12px",
                    fontSize: "11px",
                    color: "var(--text-secondary)",
                    fontFamily: "'JetBrains Mono', monospace",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                    borderBottom: "1px solid var(--border-color)"
                  }}
                >
                  {lang}
                </div>
              )}
              <pre
                style={{
                  background: "var(--code-bg)",
                  padding: "16px",
                  overflowX: "auto",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "13px",
                  lineHeight: "1.6",
                  color: "var(--code-color)",
                  margin: 0
                }}
              >
                <code>{code}</code>
              </pre>
              {isSql && (
                <div style={{ background: "var(--code-bg)", padding: "0 16px 16px 16px" }}>
                  <button
                    className="btn btn-outline"
                    style={{ fontSize: "12px", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                    onClick={() => onRunQuery(code)}
                  >
                    <Play size={14} /> Run Query
                  </button>
                </div>
              )}
            </div>
          );
        }
        return (
          <span key={i} style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {part}
          </span>
        );
      })}
    </div>
  );
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [queryResults, setQueryResults] = useState<Record<number, QueryResult>>({});
  const [runningQuery, setRunningQuery] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let sid = localStorage.getItem("querygen-ai_chat_session");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("querygen-ai_chat_session", sid);
    }
    setSessionId(sid);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const content = text || input.trim();
    if (!content || loading || !sessionId) return;
    setInput("");

    const userMsg: Message = { role: "user", content };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err: any) {
      setMessages([...newMessages, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const runQuery = async (sql: string, msgIndex: number) => {
    setRunningQuery(msgIndex);
    try {
      const res = await fetch("/api/run-query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: sql }),
      });
      const data = await res.json();
      setQueryResults(prev => ({ ...prev, [msgIndex]: data }));
    } catch (err: any) {
      setQueryResults(prev => ({
        ...prev,
        [msgIndex]: { columns: [], rows: [], error: err.message },
      }));
    } finally {
      setRunningQuery(null);
    }
  };

  const fixQuery = async (sql: string, error: string) => {
    const fixPrompt = `The following SQL query produced this error:\n\nQuery:\n\`\`\`sql\n${sql}\n\`\`\`\n\nError: ${error}\n\nPlease fix the query and return the corrected version.`;
    await sendMessage(fixPrompt);
  };

  const clearChat = () => {
    const newSid = crypto.randomUUID();
    localStorage.setItem("querygen-ai_chat_session", newSid);
    setSessionId(newSid);
    setMessages([]);
    setQueryResults({});
  };

  return (
    <>
      <Head>
        <title>AI SQL Agent — QueryGen AI</title>
      </Head>
      <Sidebar />

      <main
        className="main-content"
        style={{
          display: "flex",
          flexDirection: "column",
          height: "100vh",
          padding: "0",
        }}
      >
        {/* Header */}
        <div style={{ padding: "32px 32px 16px", flexShrink: 0, borderBottom: "1px solid var(--border-color)", background: "var(--bg-primary)" }}>
          <div className="max-w-container" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
                <Bot size={28} style={{ color: "var(--accent-blue)" }} />
                <h1 style={{ margin: 0 }}>AI SQL Agent</h1>
                <span className="badge badge-green" style={{ marginLeft: "8px" }}>
                  <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "currentColor", marginRight: "4px" }}></span> 
                  Live
                </span>
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "14px", marginLeft: "36px", margin: 0 }}>
                Your expert SQL assistant. Ask about queries, optimization, or schema design.
              </p>
            </div>
            {messages.length > 0 && (
              <button onClick={clearChat} className="btn btn-outline" style={{ fontSize: "12px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Trash2 size={14} /> New Session
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "32px 0",
            display: "flex",
            flexDirection: "column",
            gap: "24px",
            background: "var(--bg-primary)"
          }}
        >
          <div className="max-w-container" style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {messages.length === 0 && (
              <div
                className="fade-up"
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  flex: 1,
                  gap: "24px",
                  paddingTop: "64px",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    borderRadius: "16px",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "32px",
                  }}
                >
                  <Bot size={32} style={{ color: "var(--accent-blue)" }} />
                </div>
                <div style={{ textAlign: "center", maxWidth: "400px" }}>
                  <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px" }}>
                    How can I help you today?
                  </h2>
                  <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
                    I can write SQL queries, debug errors, or explain complex concepts. Your conversation is remembered across page refreshes.
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "8px",
                    justifyContent: "center",
                    maxWidth: "600px",
                  }}
                >
                  {SUGGESTED_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      className="btn btn-secondary"
                      style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "100px" }}
                      onClick={() => sendMessage(p)}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: msg.role === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "16px",
                    maxWidth: "85%",
                    flexDirection: msg.role === "user" ? "row-reverse" : "row",
                  }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: msg.role === "user" ? "var(--accent-primary)" : "var(--bg-card)",
                      border: msg.role === "user" ? "none" : "1px solid var(--border-color)",
                      color: msg.role === "user" ? "var(--bg-primary)" : "var(--text-primary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "14px",
                      flexShrink: 0,
                      boxShadow: "var(--shadow-sm)"
                    }}
                  >
                    {msg.role === "user" ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div style={{ maxWidth: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div 
                      style={{ 
                        maxWidth: "100%",
                        padding: "16px 20px",
                        borderRadius: "var(--radius-lg)",
                        fontSize: "14px",
                        color: "var(--text-primary)",
                        background: msg.role === "user" ? "var(--bg-secondary)" : "var(--bg-card)",
                        border: msg.role === "user" ? "1px solid transparent" : "1px solid var(--border-color)",
                        boxShadow: msg.role === "user" ? "none" : "var(--shadow-sm)"
                      }}
                    >
                      <MarkdownMessage
                        content={msg.content}
                        onRunQuery={(sql) => runQuery(sql, i)}
                      />
                    </div>
                    {/* Task 2: query result table */}
                    {queryResults[i] && (
                      <QueryResultTable
                        result={queryResults[i]}
                        sql={extractSQL(msg.content) || ""}
                        loading={runningQuery === i}
                        onFix={fixQuery}
                      />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-color)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "14px",
                    boxShadow: "var(--shadow-sm)"
                  }}
                >
                  <Bot size={16} />
                </div>
                <div
                  style={{ 
                    padding: "16px 20px", 
                    borderRadius: "var(--radius-lg)", 
                    background: "var(--bg-card)", 
                    border: "1px solid var(--border-color)",
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px" 
                  }}
                >
                  <span className="spinner" style={{ width: "14px", height: "14px", borderWidth: "2px" }} />
                  <span style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Thinking…</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input */}
        <div
          style={{
            padding: "24px 0",
            flexShrink: 0,
            borderTop: "1px solid var(--border-color)",
            background: "var(--bg-primary)",
          }}
        >
          <div className="max-w-container">
            <div style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
              <textarea
                className="dl-textarea"
                rows={1}
                placeholder="Ask me anything about SQL… (Enter to send, Shift+Enter for new line)"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
                style={{ 
                  flex: 1, 
                  resize: "none", 
                  minHeight: "48px", 
                  padding: "12px 16px",
                  fontSize: "14px",
                  borderRadius: "var(--radius-lg)"
                }}
              />
              <button
                className="btn btn-primary"
                onClick={() => sendMessage()}
                disabled={loading || !input.trim()}
                style={{ height: "48px", paddingLeft: "24px", paddingRight: "24px", flexShrink: 0, borderRadius: "var(--radius-lg)" }}
              >
                {loading ? (
                  <span className="spinner" style={{ width: "16px", height: "16px" }} />
                ) : (
                  "Send"
                )}
              </button>
            </div>
            {sessionId && (
              <div style={{ textAlign: "center", marginTop: "12px", fontSize: "11px", color: "var(--text-muted)" }}>
                Session: {sessionId.slice(0, 8)}…
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
