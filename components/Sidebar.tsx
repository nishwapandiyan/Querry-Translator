import React from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useTheme } from "next-themes";
import { Zap, MessageSquare, Rocket, Database, BookOpen, History, Sun, Moon, TerminalSquare } from "lucide-react";

const navItems = [
  { href: "/", label: "SQL Translator", icon: <Zap size={18} /> },
  { href: "/chat", label: "AI SQL Agent", icon: <MessageSquare size={18} /> },
  // Temporarily hidden items:
  // { href: "/playground", label: "SQL Playground", icon: <TerminalSquare size={18} /> },
  // { href: "/optimizer", label: "Query Optimizer", icon: <Rocket size={18} /> },
  // { href: "/designer", label: "Database Designer", icon: <Database size={18} /> },
  // { href: "/indexes", label: "Index Advisor", icon: <BookOpen size={18} /> },
  { href: "/history", label: "History", icon: <History size={18} /> },
];

export default function Sidebar() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  return (
    <aside className="sidebar">
      <div style={{ marginBottom: "32px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
          <Zap size={24} style={{ color: "var(--accent-primary)" }} />
          <div className="sidebar-logo text-gradient" style={{ marginBottom: 0 }}>QueryGen AI</div>
        </div>
        <div className="sidebar-subtitle">AI Database Workspace</div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`nav-item ${router.pathname === item.href ? "active" : ""}`}
          >
            <span className="nav-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div style={{ borderTop: "1px solid var(--border-color)", paddingTop: "16px", marginTop: "16px" }}>
        {/* Theme Toggle inside Sidebar */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="btn btn-outline"
          style={{ width: "100%", justifyContent: "flex-start", marginBottom: "16px", fontSize: "12px", padding: "6px 12px", gap: "8px", display: "flex", alignItems: "center" }}
        >
          {theme === 'dark' ? <><Sun size={14} /> Light Mode</> : <><Moon size={14} /> Dark Mode</>}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "var(--text-secondary)" }}>
          <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "var(--accent-green)" }}></span>
          Gemini 2.5 Flash
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>
          SQLite · Local DB
        </div>
      </div>
    </aside>
  );
}
