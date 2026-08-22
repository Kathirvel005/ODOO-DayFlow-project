"use client";

import React, { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { Terminal, Shield, CheckCircle, XCircle, Search, Filter, User, Clock } from "lucide-react";

export default function AuditCenterPage() {
  const { apiFetch } = useAuth();
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterResult, setFilterResult] = useState<"ALL" | "SUCCESS" | "FAILURE">("ALL");
  const [filterAction, setFilterAction] = useState("ALL");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await apiFetch("/api/audit?limit=200");
        setLogs(Array.isArray(res) ? res : res.logs || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const actions = ["ALL", ...Array.from(new Set(logs.map(l => l.action?.split("_")[0] || "OTHER")))];

  const filtered = logs.filter(l => {
    if (filterResult !== "ALL" && l.result !== filterResult) return false;
    if (filterAction !== "ALL" && !l.action?.startsWith(filterAction)) return false;
    if (search && !l.action?.toLowerCase().includes(search.toLowerCase()) &&
        !l.resource?.toLowerCase().includes(search.toLowerCase()) &&
        !l.actor_id?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const successCount = logs.filter(l => l.result === "SUCCESS").length;
  const failureCount = logs.filter(l => l.result === "FAILURE").length;

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleString("en-IN", { hour12: false, timeZone: "Asia/Kolkata" });
    } catch { return ts; }
  };

  const actionColor = (action: string) => {
    const a = action?.toLowerCase() || "";
    if (a.includes("login") || a.includes("auth")) return "text-cyan-400 bg-cyan-400/10";
    if (a.includes("create") || a.includes("add")) return "text-green-400 bg-green-400/10";
    if (a.includes("update") || a.includes("modify")) return "text-amber-400 bg-amber-400/10";
    if (a.includes("delete") || a.includes("remove")) return "text-red-400 bg-red-400/10";
    return "text-zinc-400 bg-zinc-400/10";
  };

  return (
    <AppShell>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <Terminal className="w-6 h-6" style={{ color: "var(--primary)" }} />
              Audit Center
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-secondary)" }}>Complete activity log and security audit trail</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>Live Monitoring</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Events", value: loading ? "—" : logs.length, icon: Terminal, color: "purple" },
            { label: "Successful", value: loading ? "—" : successCount, icon: CheckCircle, color: "green" },
            { label: "Failures", value: loading ? "—" : failureCount, icon: XCircle, color: "red" },
            { label: "Unique Actors", value: loading ? "—" : new Set(logs.map(l => l.actor_id)).size, icon: User, color: "cyan" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="glass-card rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg bg-${color}-400/10 flex items-center justify-center mb-2`}>
                <Icon className={`w-4 h-4 text-${color}-400`} />
              </div>
              <div className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>{value}</div>
              <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              placeholder="Search events..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="glass-input pl-8 pr-3 py-1.5 rounded-lg text-xs w-48"
            />
          </div>
          <Filter className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
          {(["ALL", "SUCCESS", "FAILURE"] as const).map(r => (
            <button key={r} onClick={() => setFilterResult(r)}
              className={`px-3 py-1 rounded-full text-xs transition-all ${filterResult === r ? "bg-purple-500 text-white" : ""}`}
              style={filterResult !== r ? { background: "var(--surface-soft)", color: "var(--text-secondary)" } : {}}
            >
              {r === "ALL" ? "All Results" : r}
            </button>
          ))}
          <select value={filterAction} onChange={e => setFilterAction(e.target.value)}
            className="glass-input px-3 py-1 rounded-full text-xs">
            {actions.slice(0, 15).map(a => <option key={a} value={a}>{a === "ALL" ? "All Actions" : a}</option>)}
          </select>
          <span className="text-xs ml-auto" style={{ color: "var(--text-muted)" }}>{filtered.length} events</span>
        </div>

        {/* Audit Log Table */}
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  {["Timestamp", "Actor", "Action", "Resource", "IP Address", "Result"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(10)].map((_, i) => (
                    <tr key={i}>{[...Array(6)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded animate-pulse" style={{ background: "var(--surface-soft)" }} /></td>
                    ))}</tr>
                  ))
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={6} className="px-4 py-12 text-center" style={{ color: "var(--text-muted)" }}>
                    <Shield className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    No audit events found
                  </td></tr>
                ) : (
                  filtered.slice(0, 100).map(l => (
                    <tr key={l.id} className="transition-colors text-sm" style={{ background: l.result === "FAILURE" ? "rgba(184,102,90,0.04)" : "transparent", borderBottom: "1px solid var(--border-light)" }}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                          <Clock className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                          <span className="font-mono text-xs">{formatTime(l.timestamp)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--surface-soft)" }}>
                            <User className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                          </div>
                          <span className="text-xs font-mono" style={{ color: "var(--text-secondary)" }}>{l.actor_id?.slice(0, 8)}…</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded text-xs font-medium font-mono ${actionColor(l.action)}`}>
                          {l.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "var(--text-secondary)" }}>{l.resource || "—"}</td>
                      <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{l.ip_address || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`flex items-center gap-1 text-xs font-medium ${l.result === "SUCCESS" ? "text-green-400" : "text-red-400"}`}>
                          {l.result === "SUCCESS" ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                          {l.result}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
