import { useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  Home, Activity, CreditCard, Wallet, Grid, Settings,
  Moon, Sun, Bell, Search, ArrowUpRight, ArrowDownLeft,
  Plus, ChevronRight, Check, Clock, X
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────
const ricaricheMensili = [
  { mese: "SET", tim: 42, vodafone: 28 },
  { mese: "OTT", tim: 37, vodafone: 31 },
  { mese: "NOV", tim: 55, vodafone: 39 },
  { mese: "DIC", tim: 48, vodafone: 35 },
  { mese: "GEN", tim: 63, vodafone: 44 },
];

const profittoSettimanale = [
  { giorno: "Lun", profitto: 124 },
  { giorno: "Mar", profitto: 198 },
  { giorno: "Mer", profitto: 167 },
  { giorno: "Gio", profitto: 245 },
  { giorno: "Ven", profitto: 312 },
  { giorno: "Sab", profitto: 389 },
  { giorno: "Dom", profitto: 276 },
];

const ultimeOperazioni = [
  { id: 1, tipo: "Ricarica", cliente: "Mario Rossi", data: "Oggi 14:32", importo: "+€12.50", stato: "Completata" },
  { id: 2, tipo: "Ricarica", cliente: "Anna Bianchi", data: "Oggi 13:58", importo: "+€20.00", stato: "Completata" },
  { id: 3, tipo: "Fattura", cliente: "Azienda SRL", data: "Ieri 12:15", importo: "+€150.00", stato: "In attesa" },
  { id: 4, tipo: "Ricarica", cliente: "Luca Ferrari", data: "Ieri 11:44", importo: "+€9.99", stato: "Completata" },
  { id: 5, tipo: "Ricarica", cliente: "Sara Conti", data: "20 Mag", importo: "-€15.00", stato: "Fallita" },
];

const contattiRapidi = [
  { id: 1, nome: "Mario", img: "https://i.pravatar.cc/100?img=11" },
  { id: 2, nome: "Anna", img: "https://i.pravatar.cc/100?img=5" },
  { id: 3, nome: "Luca", img: "https://i.pravatar.cc/100?img=8" },
  { id: 4, nome: "Sara", img: "https://i.pravatar.cc/100?img=9" },
];

// ─── Theme Configurations (Stile "Nova") ──────────────────────
const getTheme = (dark) =>
    dark
        ? {
          bg: "#11131F",          // Sfondo scuro profondo (blu navy)
          surface: "#1A1D2D",     // Card scure
          surfaceHover: "#23273B",
          border: "rgba(255,255,255,0.05)",
          text: "#FFFFFF",
          textMuted: "#8A8D9E",
          accent: "#6366F1",      // Indaco/Viola
          accentGradient: "linear-gradient(135deg, #2E335A 0%, #1C1B33 100%)", // Gradiente scuro Nova
          pillBg: "rgba(255,255,255,0.1)",
          barColor: "#6366F1",
          barColorLight: "#8B8DFF",
          status: {
            Completata: { bg: "transparent", color: "#FFFFFF" },
            "In attesa": { bg: "transparent", color: "#FFFFFF", border: "1px solid #6366F1" },
            Fallita: { bg: "transparent", color: "#EF4444" }
          }
        }
        : {
          bg: "#F4F5F8",          // Sfondo grigio chiarissimo
          surface: "#FFFFFF",     // Card bianche
          surfaceHover: "#F9FAFB",
          border: "rgba(0,0,0,0.04)",
          text: "#111827",
          textMuted: "#6B7280",
          accent: "#6366F1",
          accentGradient: "linear-gradient(135deg, #E0E7FF 0%, #EDE9FE 100%)", // Gradiente chiaro Nova
          pillBg: "rgba(255,255,255,0.6)",
          barColor: "#6366F1",
          barColorLight: "#A5B4FC",
          status: {
            Completata: { bg: "transparent", color: "#111827" },
            "In attesa": { bg: "transparent", color: "#111827", border: "1px solid #111827" },
            Fallita: { bg: "transparent", color: "#EF4444" }
          }
        };

// ─── Sub-components ───────────────────────────────────────────
const CustomTooltip = ({ active, payload, t }) => {
  if (!active || !payload?.length) return null;
  return (
      <div style={{
        background: t.surface, border: `1px solid ${t.border}`, borderRadius: 12,
        padding: "8px 12px", fontSize: 12, color: t.text, boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
      }}>
        <p style={{ margin: 0, fontWeight: 700 }}>{payload[0].value}</p>
      </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [activeNav, setActiveNav] = useState("home");
  const t = getTheme(dark);

  // Stili base per le card
  const cardStyle = {
    background: t.surface,
    borderRadius: 28,
    padding: 28,
    border: `1px solid ${t.border}`,
    boxShadow: dark ? "0 20px 40px rgba(0,0,0,0.2)" : "0 10px 30px rgba(0,0,0,0.03)",
  };

  return (
      <div style={{
        display: "flex", height: "100vh", background: t.bg, color: t.text,
        fontFamily: "'Inter', 'Plus Jakarta Sans', sans-serif", overflow: "hidden",
        transition: "background 0.4s ease"
      }}>

        {/* ── Sidebar (Stile Minimal Nova) ── */}
        <div style={{
          width: 90, flexShrink: 0, display: "flex", flexDirection: "column",
          alignItems: "center", padding: "32px 0", gap: 32, borderRight: `1px solid ${t.border}`
        }}>
          {/* Logo */}
          <div style={{
            width: 44, height: 44, borderRadius: 14, background: t.text,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: t.bg, fontWeight: 800, fontSize: 18, cursor: "pointer"
          }}>
            LX
          </div>

          {/* Navigation Icons */}
          <nav style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {[
              { id: "home", icon: Home },
              { id: "chart", icon: Activity },
              { id: "cards", icon: CreditCard },
              { id: "wallet", icon: Wallet },
              { id: "grid", icon: Grid },
              { id: "settings", icon: Settings },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = activeNav === item.id;
              return (
                  <div key={item.id} onClick={() => setActiveNav(item.id)} style={{
                    width: 48, height: 48, borderRadius: 16, cursor: "pointer",
                    background: isActive ? t.accent + "20" : "transparent",
                    color: isActive ? t.accent : t.textMuted,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s ease"
                  }}>
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                  </div>
              );
            })}
          </nav>

          {/* User Profile */}
          <div style={{
            width: 44, height: 44, borderRadius: "50%", background: t.surfaceHover,
            border: `2px solid ${t.border}`, cursor: "pointer",
            backgroundImage: "url('https://i.pravatar.cc/100?img=33')",
            backgroundSize: "cover"
          }} />
        </div>

        {/* ── Main Content Area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", padding: "32px 40px" }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
            <div>
              <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800, letterSpacing: "-0.03em" }}>Gestionale</h1>
              <p style={{ margin: "4px 0 0", fontSize: 15, color: t.textMuted }}>La tua area operativa personale</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {/* Top pill */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, background: t.surface,
                borderRadius: 99, padding: "8px 16px", border: `1px solid ${t.border}`,
                fontSize: 14, fontWeight: 600
              }}>
                <span>•••• 7291</span>
                <span style={{ color: t.textMuted }}>05/26</span>
              </div>
              {/* Theme Toggle */}
              <button onClick={() => setDark(!dark)} style={{
                width: 44, height: 44, borderRadius: "50%", background: t.surface,
                border: `1px solid ${t.border}`, cursor: "pointer", color: t.text,
                display: "flex", alignItems: "center", justifyContent: "center"
              }}>
                {dark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
            </div>
          </div>

          {/* Dashboard Grid Layout */}
          <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>

            {/* ── Left Column (Main Stats & Charts) ── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 32 }}>

              {/* Hero Card (Fatturato) */}
              <div style={{
                ...cardStyle, background: t.accentGradient, position: "relative",
                overflow: "hidden", display: "flex", justifyContent: "space-between"
              }}>
                {/* Graphic Blob */}
                <div style={{
                  position: "absolute", top: -50, right: -50, width: 300, height: 300,
                  background: t.accent, opacity: 0.15, filter: "blur(60px)", borderRadius: "50%"
                }} />

                <div>
                  <p style={{ margin: 0, fontSize: 14, color: dark ? t.textMuted : "#4F46E5", fontWeight: 600 }}>Fatturato Totale</p>
                  <h2 style={{ margin: "8px 0 32px", fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em", color: dark ? "#FFF" : "#111827" }}>
                    €128.450
                  </h2>

                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ background: t.pillBg, padding: "10px 16px", borderRadius: 20 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: dark ? "#FFF" : "#111827" }}>€24.1k</p>
                      <p style={{ margin: 0, fontSize: 12, color: dark ? t.textMuted : "#4B5563" }}>Ricariche</p>
                    </div>
                    <div style={{ background: t.accent, padding: "10px 16px", borderRadius: 20 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "#FFF" }}>€67.8k</p>
                      <p style={{ margin: 0, fontSize: 12, color: "rgba(255,255,255,0.8)" }}>Fatture</p>
                    </div>
                    <div style={{ background: t.pillBg, padding: "10px 16px", borderRadius: 20 }}>
                      <p style={{ margin: 0, fontSize: 16, fontWeight: 700, color: dark ? "#FFF" : "#111827" }}>€36.4k</p>
                      <p style={{ margin: 0, fontSize: 12, color: dark ? t.textMuted : "#4B5563" }}>Servizi</p>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 12, justifyContent: "center", zIndex: 1 }}>
                  {/* Decorative element like Nova */}
                  <div style={{ width: 140, height: 140, background: "rgba(255,255,255,0.1)", borderRadius: 32, marginBottom: 16, border: "1px solid rgba(255,255,255,0.2)", backdropFilter: "blur(10px)" }} />
                  <button style={{
                    background: t.surface, color: t.text, border: "none", padding: "14px 24px",
                    borderRadius: 99, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.05)"
                  }}>
                    <ArrowDownLeft size={18} /> Ricevi
                  </button>
                  <button style={{
                    background: t.accent, color: "#FFF", border: "none", padding: "14px 24px",
                    borderRadius: 99, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                    boxShadow: "0 4px 12px rgba(99,102,241,0.3)"
                  }}>
                    <ArrowUpRight size={18} /> Nuova Op.
                  </button>
                </div>
              </div>

              {/* Charts Row */}
              <div style={{ display: "flex", gap: 32 }}>

                {/* Monthly Spending -> Ricariche Mensili */}
                <div style={{ ...cardStyle, flex: 1, padding: "28px 28px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 24 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Volume Mensile</h3>
                    <span style={{ fontSize: 13, color: t.textMuted, fontWeight: 600 }}>2026</span>
                  </div>
                  <div style={{ height: 180 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ricaricheMensili} barSize={32}>
                        <XAxis dataKey="mese" axisLine={false} tickLine={false} tick={{ fill: t.textMuted, fontSize: 12, fontWeight: 600 }} dy={10} />
                        <Tooltip content={<CustomTooltip t={t} />} cursor={{fill: 'transparent'}}/>
                        <Bar dataKey="tim" stackId="a" fill={t.barColorLight} radius={[0, 0, 16, 16]} />
                        <Bar dataKey="vodafone" stackId="a" fill={t.barColor} radius={[16, 16, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Portfolio Growth -> Andamento Profitti */}
                <div style={{ ...cardStyle, flex: 1, background: t.accentGradient, position: "relative", overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: dark ? "#FFF" : "#111827" }}>Crescita Profitto</h3>
                    <div style={{ width: 32, height: 32, borderRadius: "50%", background: t.pillBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronRight size={16} color={dark ? "#FFF" : "#111827"} />
                    </div>
                  </div>
                  <h2 style={{ margin: "16px 0 4px", fontSize: 36, fontWeight: 800, color: dark ? "#FFF" : "#111827" }}>+12.4%</h2>
                  <p style={{ margin: 0, fontSize: 13, color: dark ? t.textMuted : "#4B5563", fontWeight: 500 }}>Rispetto all'anno precedente</p>

                  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 120 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={profittoSettimanale}>
                        <defs>
                          <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={t.accent} stopOpacity={0.4} />
                            <stop offset="95%" stopColor={t.accent} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <Area type="monotone" dataKey="profitto" stroke={t.accent} strokeWidth={3} fill="url(#colorProf)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* Bottom Row - Scheduled Bills / Info */}
              <div style={{ ...cardStyle }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Promemoria Scadenze</h3>
                  <span style={{ fontSize: 14, fontWeight: 600, color: t.textMuted, cursor: "pointer" }}>Vedi tutti</span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                  {[
                    { icon: "A", title: "Affitto Locale", sub: "Scade Oggi", amount: "€1.200", freq: "Mensile", alert: true },
                    { icon: "U", title: "Utenze Elettriche", sub: "15 Mag", amount: "€340", freq: "Bimestrale" }
                  ].map((bill, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        background: dark ? "rgba(255,255,255,0.02)" : "#F9FAFB", padding: 16, borderRadius: 20
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ width: 40, height: 40, borderRadius: "50%", background: t.surfaceHover, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>
                            {bill.icon}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{bill.title}</p>
                            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                              {bill.alert && <span style={{ width: 6, height: 6, borderRadius: "50%", background: t.accent }} />}
                              <p style={{ margin: 0, fontSize: 12, color: t.textMuted }}>{bill.sub}</p>
                            </div>
                          </div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
                          <span style={{ fontSize: 14, color: t.textMuted, fontWeight: 500 }}>{bill.freq}</span>
                          <span style={{ fontSize: 16, fontWeight: 800 }}>{bill.amount}</span>
                        </div>
                      </div>
                  ))}
                </div>
              </div>

            </div>

            {/* ── Right Column (Activity & Send Money) ── */}
            <div style={{ width: 380, flexShrink: 0, display: "flex", flexDirection: "column", gap: 32 }}>

              {/* Activity List */}
              <div style={{ ...cardStyle }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800 }}>Attività</h3>
                    <p style={{ margin: "2px 0 0", fontSize: 13, color: t.textMuted }}>Ultime operazioni</p>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ width: 40, height: 40, borderRadius: "50%", background: t.surfaceHover, border: "none", color: t.text, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Search size={18} />
                    </button>
                    <button style={{ background: t.text, color: t.bg, border: "none", padding: "0 16px", borderRadius: 99, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                      Vedi tutte
                    </button>
                  </div>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {ultimeOperazioni.map((op) => (
                      <div key={op.id} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "16px 0", borderBottom: op.id !== 5 ? `1px solid ${t.border}` : "none"
                      }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{
                            width: 44, height: 44, borderRadius: "50%", background: t.surfaceHover,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: op.importo.includes("-") ? t.text : t.accent
                          }}>
                            {op.importo.includes("-") ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                          </div>
                          <div>
                            <p style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{op.cliente}</p>
                            <p style={{ margin: "2px 0 0", fontSize: 13, color: t.textMuted }}>{op.data}</p>
                          </div>
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                          {/* Status Pill Nova Style */}
                          <span style={{
                            fontSize: 12, fontWeight: 600, padding: "4px 12px", borderRadius: 99,
                            background: t.status[op.stato].bg, color: t.status[op.stato].color,
                            border: t.status[op.stato].border || "none",
                            opacity: op.stato === "Completata" ? 0.7 : 1
                          }}>
                        {op.stato}
                      </span>
                          <span style={{ fontSize: 16, fontWeight: 700 }}>{op.importo}</span>
                        </div>
                      </div>
                  ))}
                </div>
              </div>

              {/* AI Insight Box (Nova Style) */}
              <div style={{ ...cardStyle, background: dark ? "rgba(255,255,255,0.02)" : "#F9FAFB", padding: 24 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>Ottimizza i profitti con l'AI</h4>
                  <span style={{ color: t.accent }}>✦</span>
                </div>
                <p style={{ margin: "0 0 12px", fontSize: 13, color: t.textMuted, lineHeight: 1.5 }}>
                  Ottieni raccomandazioni personalizzate per migliorare i margini delle tue ricariche.
                </p>
                <a href="#" style={{ color: t.text, fontSize: 13, fontWeight: 700, textDecoration: "underline" }}>Esplora suggerimenti</a>
              </div>

              {/* Quick Send Money / Ricarica Rapida */}
              <div style={{ ...cardStyle }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Invia Ricarica</h3>
                  <div style={{ display: "flex", gap: 8, background: t.surfaceHover, padding: 4, borderRadius: 99 }}>
                    <span style={{ padding: "4px 12px", background: t.surface, borderRadius: 99, fontSize: 12, fontWeight: 600, boxShadow: "0 2px 5px rgba(0,0,0,0.05)" }}>Recenti</span>
                    <span style={{ padding: "4px 12px", fontSize: 12, fontWeight: 600, color: t.textMuted }}>Preferiti</span>
                  </div>
                </div>

                {/* Avatars */}
                <div style={{ display: "flex", gap: 16, marginBottom: 24, overflowX: "auto" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 48, height: 48, borderRadius: "50%", background: t.surfaceHover, border: `1px dashed ${t.textMuted}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                      <Plus size={20} color={t.textMuted} />
                    </div>
                  </div>
                  {contattiRapidi.map((c) => (
                      <div key={c.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <img src={c.img} alt={c.nome} style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover" }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>{c.nome}</span>
                      </div>
                  ))}
                </div>

                {/* Amount Input */}
                <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                  <input
                      type="text"
                      defaultValue="€50.00"
                      style={{
                        flex: 1, border: "none", background: "transparent",
                        fontSize: 32, fontWeight: 800, color: t.text, outline: "none",
                        width: "100%"
                      }}
                  />
                  <button style={{
                    background: t.text, color: t.bg, border: "none", padding: "14px 24px",
                    borderRadius: 99, fontWeight: 700, fontSize: 14, cursor: "pointer",
                    flexShrink: 0
                  }}>
                    Invia
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
  );
}