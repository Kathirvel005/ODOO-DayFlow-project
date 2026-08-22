"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  LayoutDashboard, Users, GitBranch, Clock, CalendarDays, BarChart3, 
  ShieldAlert, Compass, PlayCircle, Bot, Wallet, ClipboardList, 
  Settings, LogOut, Bell, Search, Terminal, AlertTriangle, Info, CheckCircle,
  Sun, Moon
} from "lucide-react";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "CRITICAL" | "AI_INSIGHT";
  is_read: boolean;
  created_at: string;
}

/** Typewriter hook — types `text` char-by-char then pauses, then re-types */
function useTypewriter(text: string, speed = 90, loop = true, pauseMs = 2200) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pause" | "erasing">("typing");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < text.length) {
        timeout = setTimeout(() => setDisplayed(text.slice(0, displayed.length + 1)), speed);
      } else {
        timeout = setTimeout(() => setPhase(loop ? "pause" : "typing"), pauseMs);
      }
    } else if (phase === "pause") {
      timeout = setTimeout(() => setPhase("erasing"), 0);
    } else if (phase === "erasing") {
      if (displayed.length > 0) {
        timeout = setTimeout(() => setDisplayed(d => d.slice(0, -1)), speed * 0.55);
      } else {
        timeout = setTimeout(() => setPhase("typing"), 350);
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, text, speed, loop, pauseMs]);

  return { displayed, isTyping: phase === "typing" };
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout, apiFetch } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [showNotifDrawer, setShowNotifDrawer] = useState(false);
  const [showCmdPalette, setShowCmdPalette] = useState(false);
  const [cmdSearch, setCmdSearch] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [wsStatus, setWsStatus] = useState<"connecting" | "online" | "offline">("connecting");
  const [searchEmployees, setSearchEmployees] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(false);

  // Typewriter for brand name
  const { displayed: typedBrand, isTyping } = useTypewriter("HR LINKS", 110, true, 2500);

  // Initialise theme from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("nexora-theme");
    const dark = stored === "dark"; // default LIGHT if nothing stored
    setIsDark(dark);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("nexora-theme", next ? "dark" : "light");
  };

  // Navigation config matching Stitch
  const navItems = [
    { name: "Overview", icon: LayoutDashboard, path: "/dashboard" },
    { name: "Workforce", icon: Users, path: "/workforce" },
    { name: "Digital Twin", icon: GitBranch, path: "/digital-twin" },
    { name: "Attendance", icon: Clock, path: "/attendance" },
    { name: "Leave", icon: CalendarDays, path: "/leave" },
    { name: "Workload", icon: BarChart3, path: "/workload" },
    { name: "Risk Intelligence", icon: ShieldAlert, path: "/risk-intelligence" },
    { name: "Predictions", icon: Compass, path: "/predictions" },
    { name: "Simulation Lab", icon: PlayCircle, path: "/simulation" },
    { name: "AI Copilot", icon: Bot, path: "/ai-copilot" },
    { name: "Payroll", icon: Wallet, path: "/payroll" },
    { name: "Reports", icon: ClipboardList, path: "/reports" },
    { name: "Audit Center", icon: Terminal, path: "/audit" },
  ];

  // Load notifications
  useEffect(() => {
    if (user) {
      apiFetch("/api/notifications")
        .then((data) => setNotifications(data))
        .catch((err) => console.error("Error loading notifications:", err));
    }
  }, [user]);

  // WebSocket Live Sync
  useEffect(() => {
    let ws: WebSocket;
    
    const connectWS = () => {
      const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const wsUrl = rawApiUrl.replace(/^http:\/\//, "ws://").replace(/^https:\/\//, "wss://");
      ws = new WebSocket(`${wsUrl}/api/ws`);
      
      ws.onopen = () => {
        setWsStatus("online");
        logger("WebSocket online");
      };
      
      ws.onmessage = (event) => {
        if (event.data === "pong") return;
        try {
          const payload = JSON.parse(event.data);
          // Prepend new notification or alert
          const newNotif: NotificationItem = {
            id: Math.random().toString(),
            title: payload.event === "attendance.updated" ? "Attendance Alert" : 
                   payload.event === "simulation.completed" ? "Simulation Lab Alert" : "Live Alert",
            message: payload.data.message || `${payload.event}: ${JSON.stringify(payload.data)}`,
            type: payload.data.anomaly ? "CRITICAL" : "INFO",
            is_read: false,
            created_at: new Date().toISOString()
          };
          
          setNotifications(prev => [newNotif, ...prev]);
        } catch (e) {
          console.error("WS parse error", e);
        }
      };
      
      ws.onclose = () => {
        setWsStatus("offline");
        setTimeout(connectWS, 5000); // retry reconnect in 5s
      };
      
      ws.onerror = () => {
        setWsStatus("offline");
      };
    };

    connectWS();
    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Keyboard Ctrl+K Command Palette trigger
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setShowCmdPalette(prev => !prev);
      }
      if (e.key === "Escape") {
        setShowCmdPalette(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Command palette employee search
  useEffect(() => {
    if (cmdSearch.trim().length > 1) {
      apiFetch(`/api/employees?search=${cmdSearch}&limit=5`)
        .then(res => setSearchEmployees(res.data || []))
        .catch(() => {});
    } else {
      setSearchEmployees([]);
    }
  }, [cmdSearch]);

  const markRead = async (id: string) => {
    try {
      await apiFetch(`/api/notifications/${id}/read`, { method: "POST" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (e) {
      // Mock update if local mock UUID
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex h-screen overflow-hidden font-sans relative" style={{ background: "var(--background)", color: "var(--text-primary)" }}>
      
      {/* Background radial neon glows */}
      <div className="bg-glow top-[-250px] left-[-100px]"></div>
      <div className="bg-glow bottom-[-200px] right-[-100px] bg-cyan-500/5"></div>

      {/* Sidebar Navigation */}
      <aside className={`glass-panel flex flex-col justify-between transition-all duration-300 z-30 ${sidebarOpen ? "w-64" : "w-16"}`}>
        <div>
          {/* Brand Header */}
          <div className="h-16 flex items-center px-4 gap-3" style={{ borderBottom: "1px solid var(--border)" }}>
            <div className="brand-logo w-8 h-8 rounded-lg logo-badge flex items-center justify-center font-bold text-lg text-white shadow-lg">
              H
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl tracking-widest flex items-center gap-0" style={{ color: "var(--text-primary)", minWidth: "7ch" }}>
                {typedBrand}
                {/* Blinking cursor */}
                <span
                  style={{
                    display: "inline-block",
                    width: "2px",
                    height: "1.1em",
                    marginLeft: "2px",
                    background: "var(--primary)",
                    borderRadius: "1px",
                    verticalAlign: "middle",
                    animation: isTyping
                      ? "none"
                      : "blink-cursor 1s step-end infinite",
                    opacity: isTyping ? 1 : undefined,
                  }}
                />
              </span>
            )}
          </div>

          {/* Navigation Tree */}
          <nav className="p-3 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)] stagger-children">
            {navItems.map((item) => {
              const active = pathname === item.path;
              return (
                <button
                  key={item.name}
                  onClick={() => router.push(item.path)}
                  style={active ? {
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    border: "1px solid var(--primary-light)",
                  } : {
                    color: "var(--text-secondary)",
                    border: "1px solid transparent",
                  }}
                  className="nav-item w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium animate-slide-in-left"
                  title={item.name}
                >
                  <item.icon className="w-5 h-5 shrink-0" />
                  {sidebarOpen && <span>{item.name}</span>}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Area */}
        <div className="p-4 space-y-3 animate-fade-in-up" style={{ borderTop: "1px solid var(--border)", background: "var(--background-secondary)" }}>
          {/* AI Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className={`ping-dot w-2.5 h-2.5 rounded-full ${wsStatus === "online" ? "bg-purple-500" : ""}`}
              style={wsStatus !== "online" ? { background: "var(--text-muted)" } : {}}></span>
            {sidebarOpen && (
              <span className="font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                HR LINKS AI Online
              </span>
            )}
          </div>
          
          {/* Executive Demo button */}
          {sidebarOpen && (
            <button 
              onClick={() => router.push("/executive-demo")}
              className="w-full text-xs py-2 bg-gradient-to-r from-purple-500/20 to-cyan-500/20 hover:from-purple-500/30 hover:to-cyan-500/30 border border-purple-500/30 rounded text-center font-bold tracking-wide transition"
              style={{ color: "var(--primary)" }}
            >
              Start Executive Demo
            </button>
          )}

          {/* User profile widget */}
          {sidebarOpen && user && (
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-primary)" }}>
                  {user.email.substring(0, 2).toUpperCase()}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold truncate w-28" style={{ color: "var(--text-primary)" }}>{user.email}</div>
                  <div className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>{user.role}</div>
                </div>
              </div>
              <button 
                onClick={logout}
                className="p-1 rounded transition hover:text-red-500"
                style={{ color: "var(--text-muted)" }}
                title="Log out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Main Layout Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Top Header Bar */}
        <header className="h-16 flex items-center justify-between px-6 z-20 backdrop-blur-md" style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)" }}>
          {/* Left search */}
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-sm font-semibold focus:outline-none transition"
              style={{ color: "var(--text-muted)" }}
            >
              ☰
            </button>
            
            {/* Ctrl+K search triggers command palette */}
            <div 
              onClick={() => setShowCmdPalette(true)}
              className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer w-64 transition"
              style={{ border: "1px solid var(--border)", background: "var(--background-secondary)", color: "var(--text-muted)" }}
            >
              <Search className="w-4 h-4" />
              <span className="text-xs">Search...</span>
              <kbd className="ml-auto text-[9px] font-mono px-1 rounded" style={{ background: "var(--surface-soft)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}>Ctrl+K</kbd>
            </div>
          </div>

          {/* Right widgets */}
          <div className="flex items-center gap-4">
            {/* Live WS Status Indicator */}
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-mono" style={{ border: "1px solid var(--border)", background: "var(--background-secondary)", color: "var(--text-muted)" }}>
              <span className={`ping-dot w-1.5 h-1.5 rounded-full ${wsStatus === "online" ? "bg-green-500" : "bg-red-500"}`}></span>
              WS: {wsStatus}
            </div>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition"
              style={{ color: "var(--text-muted)", background: "var(--surface-soft)" }}
              title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>

            {/* Notification bell */}
            <div className="relative">
              <button 
                onClick={() => setShowNotifDrawer(!showNotifDrawer)}
                className="p-2 rounded-lg relative transition"
                style={{ color: "var(--text-muted)" }}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-purple-500 text-[10px] font-bold text-white rounded-full flex items-center justify-center animate-bounce-in">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Drawer Popover */}
              {showNotifDrawer && (
                <div className="notif-drawer absolute right-0 mt-2 w-80 glass-panel rounded-xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)", background: "var(--background-secondary)" }}>
                    <span className="font-bold text-xs tracking-wide" style={{ color: "var(--text-primary)" }}>NOTIFICATIONS</span>
                    <button 
                      onClick={() => setShowNotifDrawer(false)}
                      className="text-xs transition"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Close
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto" style={{ borderTop: "1px solid var(--border-light)" }}>
                    {notifications.length === 0 ? (
                      <div className="p-8 text-center text-xs" style={{ color: "var(--text-muted)" }}>No new notifications.</div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => markRead(n.id)}
                          className={`p-3 text-xs transition cursor-pointer ${n.is_read ? "opacity-60" : ""}`}
                          style={{ borderBottom: "1px solid var(--border-light)", background: n.is_read ? "transparent" : "var(--primary-soft)" }}
                        >
                          <div className="flex items-center gap-1.5 font-bold mb-0.5">
                            {n.type === "CRITICAL" && <AlertTriangle className="w-3.5 h-3.5 text-red-400" />}
                            {n.type === "WARNING" && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                            {n.type === "AI_INSIGHT" && <Bot className="w-3.5 h-3.5 text-purple-400" />}
                            {n.type === "INFO" && <Info className="w-3.5 h-3.5 text-cyan-400" />}
                            <span style={{ color: "var(--text-primary)" }}>{n.title}</span>
                          </div>
                          <div className="leading-relaxed" style={{ color: "var(--text-secondary)" }}>{n.message}</div>
                          <div className="text-[9px] mt-1" style={{ color: "var(--text-muted)" }}>{new Date(n.created_at).toLocaleTimeString()}</div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile + Logout */}
            <div className="flex items-center gap-2 pl-4" style={{ borderLeft: "1px solid var(--border)" }}>
              {/* Avatar + user info */}
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full logo-badge flex items-center justify-center font-bold text-xs text-white shadow">
                  {user?.email?.substring(0, 1).toUpperCase() || "U"}
                </div>
                <div className="hidden md:block text-left">
                  <div className="text-xs font-semibold leading-tight max-w-[120px] truncate" style={{ color: "var(--text-primary)" }}>
                    {user?.email || "User"}
                  </div>
                  <div className="text-[9px] font-mono uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                    {user?.role || "staff"}
                  </div>
                </div>
              </div>

              {/* Logout button */}
              <button
                onClick={logout}
                title="Log out"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all hover:opacity-90 active:scale-95 animate-fade-in-up"
                style={{ background: "var(--danger)", color: "#fff" }}
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 overflow-y-auto p-6 z-10">
          {children}
        </main>
      </div>

      {/* Ctrl+K Command Palette Modal */}
      {showCmdPalette && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-start justify-center pt-24" style={{ background: "rgba(0,0,0,0.5)" }}>
          <div className="cmd-palette w-full max-w-lg glass-panel rounded-xl shadow-2xl overflow-hidden">
            <div className="p-3 flex items-center gap-3" style={{ borderBottom: "1px solid var(--border)", background: "var(--background-secondary)" }}>
              <Search className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
              <input 
                autoFocus
                type="text" 
                placeholder="Search employees or jump to dashboard..." 
                className="flex-1 bg-transparent border-none outline-none text-sm placeholder:opacity-50"
                style={{ color: "var(--text-primary)" }}
                value={cmdSearch}
                onChange={e => setCmdSearch(e.target.value)}
              />
              <button 
                onClick={() => setShowCmdPalette(false)}
                className="text-xs transition"
                style={{ color: "var(--text-muted)" }}
              >
                ESC
              </button>
            </div>
            
            <div className="p-2 max-h-80 overflow-y-auto">
              {/* Employee search results */}
              {searchEmployees.length > 0 && (
                <div className="py-2">
                  <div className="text-[10px] font-bold px-2 uppercase tracking-wide mb-1" style={{ color: "var(--primary)" }}>Employees</div>
                  {searchEmployees.map(emp => (
                    <div 
                      key={emp.id}
                      onClick={() => {
                        setShowCmdPalette(false);
                        router.push(`/workforce/${emp.id}`);
                      }}
                      className="px-2 py-1.5 rounded-lg cursor-pointer flex items-center justify-between text-xs transition"
                      style={{ color: "var(--text-secondary)" }}
                      onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-soft)")}
                      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                    >
                      <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{emp.name}</span>
                      <span className="font-mono" style={{ color: "var(--text-muted)" }}>{emp.designation}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Navigation short cuts */}
              <div className="py-2">
                <div className="text-[10px] font-bold px-2 uppercase tracking-wide mb-1" style={{ color: "var(--chart-secondary)" }}>Quick Links</div>
                {navItems.slice(0, 7).map(item => (
                  <div 
                    key={item.name}
                    onClick={() => {
                      setShowCmdPalette(false);
                      router.push(item.path);
                    }}
                    className="px-2 py-1.5 rounded-lg cursor-pointer flex items-center gap-3 text-xs transition"
                    onMouseEnter={e => (e.currentTarget.style.background = "var(--surface-soft)")}
                    onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                  >
                    <item.icon className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                    <span style={{ color: "var(--text-primary)" }}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function logger(msg: string) {
  console.log(`[HRLinksApp] ${msg}`);
}
