"use client";

import React, { useState, useEffect, useRef } from "react";
import AppShell from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import {
  CalendarDays, Clock, CheckCircle, XCircle, Plus, User,
  X, ChevronLeft, ChevronRight, Upload
} from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DAYS_SHORT = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function daysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function firstDay(year: number, month: number) { return new Date(year, month, 1).getDay(); }
function toISO(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

const LEAVE_TYPES = [
  { key: "PAID",     label: "Paid Time Off", color: "#D95F52", total: 24 },
  { key: "SICK",     label: "Sick Leave",    color: "#5BA4CF", total: 12 },
  { key: "UNPAID",   label: "Unpaid Leave",  color: "#F2C94C", total: 0  },
  { key: "CASUAL",   label: "Casual Leave",  color: "#27AE60", total: 8  },
  { key: "VACATION", label: "Vacation",      color: "#9B59B6", total: 15 },
];

function MiniMonth({ year, month, leaveDates, onDayClick }: {
  year: number; month: number;
  leaveDates: Record<string, string>;
  onDayClick?: (iso: string) => void;
}) {
  const total = daysInMonth(year, month);
  const start = firstDay(year, month);
  const cells: (number | null)[] = [...Array(start).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)];
  while (cells.length % 7 !== 0) cells.push(null);
  const todayISO = toISO(new Date().getFullYear(), new Date().getMonth(), new Date().getDate());

  return (
    <div style={{ minWidth: 0 }}>
      <div className="text-xs font-bold mb-1 uppercase tracking-wide" style={{ color: "var(--text-primary)" }}>
        {MONTHS[month]} {year}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {DAYS_SHORT.map(d => (
          <div key={d} className="text-center text-[9px] font-semibold pb-0.5" style={{ color: "var(--text-muted)" }}>{d}</div>
        ))}
        {cells.map((day, idx) => {
          const iso = day ? toISO(year, month, day) : "";
          const lc = iso ? leaveDates[iso] : undefined;
          const isToday = iso === todayISO;
          return (
            <div key={idx} onClick={() => day && onDayClick?.(iso)}
              className="text-center text-[10px] rounded cursor-pointer transition-all"
              style={{
                padding: "2px 0",
                background: lc ? lc + "33" : "transparent",
                color: lc ? lc : isToday ? "var(--primary)" : "var(--text-secondary)",
                fontWeight: isToday || lc ? 700 : 400,
                border: isToday ? "1px solid var(--primary)" : "1px solid transparent",
                borderRadius: "4px",
              }}>
              {day || ""}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LeavePage() {
  const { apiFetch, user } = useAuth();
  const [loading, setLoading]       = useState(true);
  const [leaves, setLeaves]         = useState<any[]>([]);
  const [showForm, setShowForm]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab]   = useState<"calendar"|"list">("calendar");
  const [calYear, setCalYear]       = useState(new Date().getFullYear());
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    leave_type: "PAID", start_date: "", end_date: "", reason: "", attachment: "",
  });

  async function load() {
    try {
      setLoading(true);
      const res = await apiFetch("/api/leave?limit=500");
      setLeaves(Array.isArray(res) ? res : []);
    } catch { } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setSubmitting(true);
      await apiFetch("/api/leave", { method: "POST", body: JSON.stringify({
        leave_type: form.leave_type, start_date: form.start_date,
        end_date: form.end_date, reason: form.reason,
      })});
      setShowForm(false);
      setForm({ leave_type: "PAID", start_date: "", end_date: "", reason: "", attachment: "" });
      await load();
    } catch (e) { console.error(e); } finally { setSubmitting(false); }
  }

  const leaveDates: Record<string, string> = {};
  leaves.filter(l => l.status === "APPROVED").forEach(l => {
    const cfg = LEAVE_TYPES.find(t => t.key === l.leave_type);
    if (!cfg || !l.start_date || !l.end_date) return;
    const s = new Date(l.start_date), en = new Date(l.end_date);
    for (let d = new Date(s); d <= en; d.setDate(d.getDate() + 1)) {
      leaveDates[d.toISOString().slice(0, 10)] = cfg.color;
    }
  });

  const usedDays = (key: string) => leaves
    .filter(l => l.leave_type === key && l.status === "APPROVED")
    .reduce((acc, l) => acc + Math.round((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1, 0);

  const stats = {
    total: leaves.length,
    pending:  leaves.filter(l => l.status === "PENDING").length,
    approved: leaves.filter(l => l.status === "APPROVED").length,
    rejected: leaves.filter(l => l.status === "REJECTED").length,
  };

  const isHR = user?.role && ["HR_ADMIN","HR_MANAGER","SUPER_ADMIN"].includes(user.role);

  const allocDays = form.start_date && form.end_date
    ? Math.max(1, Math.round((new Date(form.end_date).getTime() - new Date(form.start_date).getTime()) / 86400000) + 1)
    : 1;

  return (
    <AppShell>
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between animate-fade-in-up">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
              <CalendarDays className="w-6 h-6" style={{ color: "var(--primary)" }} />
              Time Off
            </h1>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
              Manage and track employee leave requests
            </p>
          </div>
          <button onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
            style={{ background: "var(--primary)" }}>
            <Plus className="w-4 h-4" /> NEW
          </button>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 stagger-children">
          {LEAVE_TYPES.map(lt => {
            const used = usedDays(lt.key);
            const avail = Math.max(0, lt.total - used);
            const pct = lt.total > 0 ? (used / lt.total) * 100 : 0;
            return (
              <div key={lt.key} className="glass-card rounded-xl p-4 animate-fade-in-up">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wide" style={{ color: lt.color }}>{lt.label}</span>
                  <span className="w-2.5 h-2.5 rounded-full ping-dot" style={{ background: lt.color }} />
                </div>
                <div className="text-2xl font-black" style={{ color: "var(--text-primary)" }}>{loading ? "—" : avail}</div>
                <div className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)" }}>Days Available</div>
                {lt.total > 0 && (
                  <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: lt.color }} />
                  </div>
                )}
                <div className="text-[9px] mt-1" style={{ color: "var(--text-disabled)" }}>
                  {lt.total > 0 ? `${used} used of ${lt.total}` : "Unlimited"}
                </div>
              </div>
            );
          })}
        </div>

        {/* KPI Row */}
        <div className="grid grid-cols-4 gap-3 stagger-children">
          {[
            { label: "Total Requests", value: stats.total,    color: "var(--primary)", icon: CalendarDays },
            { label: "Pending Review", value: stats.pending,  color: "var(--warning)",  icon: Clock },
            { label: "Approved",       value: stats.approved, color: "var(--success)",  icon: CheckCircle },
            { label: "Rejected",       value: stats.rejected, color: "var(--danger)",   icon: XCircle },
          ].map(({ label, value, color, icon: Icon }) => (
            <div key={label} className="glass-card rounded-xl p-4 flex items-center gap-3 animate-fade-in-up">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: color + "18" }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div>
                <div className="text-xl font-black" style={{ color: "var(--text-primary)" }}>{loading ? "—" : value}</div>
                <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>{label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-xl w-fit" style={{ background: "var(--surface-soft)" }}>
          {(["calendar","list"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className="px-5 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
              style={activeTab === tab ? { background: "var(--primary)", color: "#fff" } : { background: "transparent", color: "var(--text-muted)" }}>
              {tab === "calendar" ? "📅 Calendar" : "📋 Requests"}
            </button>
          ))}
        </div>

        {/* Calendar View */}
        {activeTab === "calendar" && (
          <div className="animate-fade-in-up space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setCalYear(y => y - 1)} className="p-1.5 rounded-lg transition hover:opacity-80"
                style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>{calYear}</span>
              <button onClick={() => setCalYear(y => y + 1)} className="p-1.5 rounded-lg transition hover:opacity-80"
                style={{ background: "var(--surface-soft)", color: "var(--text-muted)" }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            <div className="flex gap-4">
              {/* 12-month grid */}
              <div className="flex-1 glass-card rounded-xl p-5">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
                  {Array.from({ length: 12 }, (_, m) => (
                    <MiniMonth key={m} year={calYear} month={m} leaveDates={leaveDates}
                      onDayClick={(iso) => {
                        setForm(f => ({ ...f, start_date: iso, end_date: iso }));
                        setShowForm(true);
                      }} />
                  ))}
                </div>
              </div>
              {/* Side legend */}
              <div className="w-52 shrink-0 space-y-3">
                <div className="glass-card rounded-xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>TimeOff Types</div>
                  <div className="space-y-2.5">
                    {LEAVE_TYPES.map(lt => (
                      <div key={lt.key} className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full shrink-0" style={{ background: lt.color }} />
                        <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>{lt.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="glass-card rounded-xl p-4">
                  <div className="text-xs font-bold uppercase tracking-wide mb-2" style={{ color: "var(--text-muted)" }}>Public Holidays</div>
                  {[
                    { name: "Republic Day",     date: "Jan 26" },
                    { name: "Independence Day", date: "Aug 15" },
                    { name: "Gandhi Jayanti",   date: "Oct 2"  },
                    { name: "Christmas",        date: "Dec 25" },
                  ].map(h => (
                    <div key={h.name} className="flex justify-between items-center py-0.5">
                      <span className="text-[10px]" style={{ color: "var(--text-secondary)" }}>{h.name}</span>
                      <span className="text-[10px] font-mono" style={{ color: "var(--primary)" }}>{h.date}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Requests List */}
        {activeTab === "list" && (
          <div className="glass-card rounded-xl overflow-hidden animate-fade-in-up">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--border)" }}>
                    {["Employee","Type","Duration","Dates","Reason","Status", isHR ? "Actions" : ""].filter(Boolean).map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? [...Array(5)].map((_, i) => (
                    <tr key={i}>{[...Array(7)].map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="h-4 rounded shimmer" /></td>
                    ))}</tr>
                  )) : leaves.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-sm" style={{ color: "var(--text-muted)" }}>No leave requests found</td></tr>
                  ) : leaves.slice(0, 80).map(l => {
                    const cfg = LEAVE_TYPES.find(t => t.key === l.leave_type);
                    const days = Math.max(1, Math.round((new Date(l.end_date).getTime() - new Date(l.start_date).getTime()) / 86400000) + 1);
                    const sc = l.status === "APPROVED" ? "var(--success)" : l.status === "REJECTED" ? "var(--danger)" : "var(--warning)";
                    return (
                      <tr key={l.id} className="transition-colors" style={{ borderBottom: "1px solid var(--border-light)" }}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--primary-soft)" }}>
                              <User className="w-3 h-3" style={{ color: "var(--primary)" }} />
                            </div>
                            <span className="text-xs font-medium" style={{ color: "var(--text-primary)" }}>
                              {l.employee_name || l.employee_id?.slice(0, 8)}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium"
                            style={{ background: (cfg?.color || "#999") + "22", color: cfg?.color || "#999" }}>
                            {cfg?.label || l.leave_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: "var(--text-secondary)" }}>{days} day{days !== 1 ? "s" : ""}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>{l.start_date} → {l.end_date}</td>
                        <td className="px-4 py-3 text-xs max-w-xs truncate" style={{ color: "var(--text-secondary)" }}>{l.reason || "—"}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: sc + "22", color: sc }}>{l.status}</span>
                        </td>
                        {isHR && (
                          <td className="px-4 py-3">
                            {l.status === "PENDING" && (
                              <div className="flex gap-1">
                                <button onClick={() => apiFetch(`/api/leave/${l.id}/approve`, { method: "PATCH", body: JSON.stringify({ status: "APPROVED", comments: "Approved via HR Links" }) }).then(load)}
                                  className="px-2 py-1 rounded text-[10px] font-semibold transition hover:opacity-80"
                                  style={{ background: "var(--success)", color: "#fff" }}>✓ Approve</button>
                                <button onClick={() => apiFetch(`/api/leave/${l.id}/approve`, { method: "PATCH", body: JSON.stringify({ status: "REJECTED", comments: "Rejected via HR Links" }) }).then(load)}
                                  className="px-2 py-1 rounded text-[10px] font-semibold transition hover:opacity-80"
                                  style={{ background: "var(--danger)", color: "#fff" }}>✗ Reject</button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Time Off Type Request Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.4)" }}
            onClick={e => e.target === e.currentTarget && setShowForm(false)}>
            <div className="animate-scale-in w-full max-w-sm rounded-2xl shadow-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

              {/* Modal header */}
              <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4" style={{ color: "var(--primary)" }} />
                  <span className="font-bold text-sm" style={{ color: "var(--text-primary)" }}>Time off Type Request</span>
                </div>
                <button onClick={() => setShowForm(false)} className="p-1 rounded-lg transition hover:opacity-70" style={{ color: "var(--text-muted)" }}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {/* Employee */}
                <div className="flex items-center gap-3">
                  <label className="w-28 text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>Employee</label>
                  <span className="text-sm font-medium" style={{ color: "var(--primary)" }}>{user?.email || "[Employee]"}</span>
                </div>

                {/* Time off Type */}
                <div className="flex items-center gap-3">
                  <label className="w-28 text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>Time off Type</label>
                  <select value={form.leave_type} onChange={e => setForm({ ...form, leave_type: e.target.value })}
                    className="glass-input flex-1 px-3 py-1.5 rounded-lg text-sm" style={{ color: "var(--primary)" }}>
                    {LEAVE_TYPES.map(lt => <option key={lt.key} value={lt.key}>{lt.label}</option>)}
                  </select>
                </div>

                {/* Validity Period */}
                <div className="flex items-center gap-3">
                  <label className="w-28 text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>Validity Period</label>
                  <div className="flex items-center gap-2 flex-1">
                    <input type="date" required value={form.start_date}
                      onChange={e => setForm({ ...form, start_date: e.target.value })}
                      className="glass-input flex-1 px-2 py-1.5 rounded-lg text-xs" style={{ color: "var(--warning)" }} />
                    <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>To</span>
                    <input type="date" required value={form.end_date}
                      onChange={e => setForm({ ...form, end_date: e.target.value })}
                      className="glass-input flex-1 px-2 py-1.5 rounded-lg text-xs" style={{ color: "var(--warning)" }} />
                  </div>
                </div>

                {/* Allocation */}
                <div className="flex items-center gap-3">
                  <label className="w-28 text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>Allocation</label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold" style={{ color: "var(--info)" }}>
                      {String(allocDays).padStart(2, "0")}.00
                    </span>
                    <span className="text-sm font-medium" style={{ color: "var(--info)" }}>Days</span>
                  </div>
                </div>

                {/* Reason */}
                <div className="flex items-start gap-3">
                  <label className="w-28 text-xs font-semibold shrink-0 pt-1" style={{ color: "var(--text-muted)" }}>Reason</label>
                  <textarea rows={2} value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
                    className="glass-input flex-1 px-3 py-2 rounded-lg text-sm resize-none"
                    placeholder="Optional reason..." />
                </div>

                {/* Attachment */}
                <div className="flex items-center gap-3">
                  <label className="w-28 text-xs font-semibold shrink-0" style={{ color: "var(--text-muted)" }}>Attachment</label>
                  <div className="flex items-center gap-2 flex-1">
                    <button type="button" onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition hover:opacity-80"
                      style={{ background: "var(--info)", color: "#fff" }}>
                      <Upload className="w-3.5 h-3.5" />
                      {form.attachment || "Upload"}
                    </button>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>(For sick leave certificate)</span>
                    <input ref={fileRef} type="file" className="hidden"
                      onChange={e => setForm({ ...form, attachment: e.target.files?.[0]?.name || "" })} />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-2" style={{ borderTop: "1px solid var(--border)" }}>
                  <button type="submit" disabled={submitting}
                    className="px-5 py-2 rounded-lg text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                    style={{ background: "var(--primary)" }}>
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)}
                    className="px-5 py-2 rounded-lg text-sm font-medium transition hover:opacity-80"
                    style={{ background: "var(--surface-soft)", color: "var(--text-secondary)" }}>
                    Discard
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
