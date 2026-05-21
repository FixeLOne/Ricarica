import { useState } from "react";
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import {
  LayoutDashboard, Smartphone, FileText, Tag, Store, Users,
  Settings, Moon, Sun, Bell, Search, TrendingUp, TrendingDown,
  Plus, ChevronRight, Zap, Euro, Activity, CheckCircle2,
  Clock, XCircle, MoreHorizontal, LogOut, RefreshCw
} from "lucide-react";

// ─── Mock Data ────────────────────────────────────────────────
const ricaricheMensili = [
  { mese: "GEN", tim: 42, vodafone: 28, iliad: 35, wind: 19 },
  { mese: "FEB", tim: 37, vodafone: 31, iliad: 41, wind: 22 },
  { mese: "MAR", tim: 55, vodafone: 39, iliad: 48, wind: 30 },
  { mese: "APR", tim: 48, vodafone: 35, iliad: 52, wind: 27 },
  { mese: "MAG", tim: 63, vodafone: 44, iliad: 58, wind: 33 },
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
  { id: 1, tipo: "Ricarica", cliente: "Mario Rossi", operatore: "TIM", importo: "+€12.50", profitto: "+€2.50", stato: "completata", ora: "14:32" },
  { id: 2, tipo: "Ricarica", cliente: "Anna Bianchi", operatore: "Vodafone", importo: "+€20.00", profitto: "+€4.00", stato: "completata", ora: "13:58" },
  { id: 3, tipo: "Fattura", cliente: "Azienda SRL", operatore: "—", importo: "+€150.00", profitto: "+€30.00", stato: "in attesa", ora: "12:15" },
  { id: 4, tipo: "Ricarica", cliente: "Luca Ferrari", operatore: "Iliad", importo: "+€9.99", profitto: "+€1.50", stato: "completata", ora: "11:44" },
  { id: 5, tipo: "Ricarica", cliente: "Sara Conti", operatore: "WindTre", importo: "+€15.00", profitto: "+€3.00", stato: "fallita", ora: "10:20" },
  { id: 6, tipo: "Ricarica", cliente: "Marco Verdi", operatore: "TIM", importo: "+€30.00", profitto: "+€6.00", stato: "completata", ora: "09:55" },
];

const tariffe = [
  { id: 1, operatore: "TIM", giga: 5, costo: "€8.00", vendita: "€10.50", margine: "23%" },
  { id: 2, operatore: "Vodafone", giga: 10, costo: "€12.00", vendita: "€15.99", margine: "25%" },
  { id: 3, operatore: "Iliad", giga: 50, costo: "€7.90", vendita: "€9.99", margine: "21%" },
  { id: 4, operatore: "WindTre", giga: 20, costo: "€10.50", vendita: "€13.50", margine: "22%" },
];

const boutique = [
  { nome: "Sambuceto Centro", operazioni: 147, profitto: "€312.50", trend: +12 },
  { nome: "Pescara Corso", operazioni: 89, profitto: "€198.20", trend: +5 },
  { nome: "Chieti Scalo", operazioni: 64, profitto: "€134.80", trend: -3 },
];

// ─── Operator Colors ──────────────────────────────────────────
const opColor = {
  TIM: "#0066CC",
  Vodafone: "#E60000",
  Iliad: "#FF3C00",
  WindTre: "#FF6600",
  "—": "#888",
};

const opBg = {
  TIM: "#E6F0FF",
  Vodafone: "#FFE6E6",
  Iliad: "#FFF0EB",
  WindTre: "#FFF3EB",
  "—": "#F0F0F0",
};

// ─── Theme ────────────────────────────────────────────────────
const getTheme = (dark) =>
  dark
    ? {
        bg: "#0D1117",
        surface: "#161B22",
        surface2: "#1C2128",
        border: "#30363D",
        text: "#E6EDF3",
        textMuted: "#8B949E",
        accent: "#7C6FF7",
        accentLight: "#1E1A4A",
        accentText: "#A78BFA",
        green: "#3FB950",
        greenBg: "#0D2116",
        red: "#F85149",
        redBg: "#2C1115",
        amber: "#D29922",
        amberBg: "#2B2000",
        barColors: ["#7C6FF7", "#60A5FA", "#34D399", "#F59E0B"],
        chartGrid: "#21262D",
        tooltipBg: "#1C2128",
      }
    : {
        bg: "#EEF0F7",
        surface: "#FFFFFF",
        surface2: "#F6F7FE",
        border: "#E2E5F0",
        text: "#1A1D35",
        textMuted: "#6B7280",
        accent: "#6366F1",
        accentLight: "#EEF0FF",
        accentText: "#6366F1",
        green: "#059669",
        greenBg: "#ECFDF5",
        red: "#DC2626",
        redBg: "#FEF2F2",
        amber: "#D97706",
        amberBg: "#FFFBEB",
        barColors: ["#6366F1", "#60A5FA", "#34D399", "#F59E0B"],
        chartGrid: "#F0F2FA",
        tooltipBg: "#FFFFFF",
      };

// ─── Sub-components ───────────────────────────────────────────
function NavItem({ icon: Icon, label, active, collapsed, t, onClick }) {
  return (
    <div
      onClick={onClick}
      title={collapsed ? label : undefined}
      style={{
        display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
        borderRadius: 10, cursor: "pointer", transition: "all 0.15s",
        background: active ? t.accentLight : "transparent",
        color: active ? t.accent : t.textMuted,
        fontWeight: active ? 600 : 400,
        marginBottom: 2,
      }}
    >
      <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
      {!collapsed && <span style={{ fontSize: 13 }}>{label}</span>}
    </div>
  );
}

function StatCard({ label, value, sub, trend, icon: Icon, t }) {
  const up = trend >= 0;
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16,
      padding: "18px 20px", flex: 1, minWidth: 0,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <p style={{ margin: 0, fontSize: 12, color: t.textMuted, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>{label}</p>
          <p style={{ margin: "6px 0 2px", fontSize: 26, fontWeight: 700, color: t.text, letterSpacing: "-0.03em" }}>{value}</p>
          <p style={{ margin: 0, fontSize: 12, color: up ? t.green : t.red, fontWeight: 600 }}>
            {up ? "▲" : "▼"} {Math.abs(trend)}% vs ieri
          </p>
        </div>
        <div style={{
          width: 40, height: 40, borderRadius: 10, background: t.accentLight,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={t.accent} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ stato, t }) {
  const cfg = {
    completata: { bg: t.greenBg, color: t.green, icon: CheckCircle2, label: "Completata" },
    "in attesa": { bg: t.amberBg, color: t.amber, icon: Clock, label: "In attesa" },
    fallita: { bg: t.redBg, color: t.red, icon: XCircle, label: "Fallita" },
  }[stato] || { bg: t.surface2, color: t.textMuted, icon: Activity, label: stato };
  const Icon = cfg.icon;
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11,
      background: cfg.bg, color: cfg.color, borderRadius: 6, padding: "3px 8px", fontWeight: 600,
    }}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function OperatoreBadge({ nome }) {
  return (
    <span style={{
      fontSize: 11, fontWeight: 700, background: opBg[nome] || "#F0F0F0",
      color: opColor[nome] || "#888", borderRadius: 6, padding: "2px 8px",
    }}>{nome}</span>
  );
}

const CustomTooltip = ({ active, payload, label, t }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: t.tooltipBg, border: `1px solid ${t.border}`, borderRadius: 10,
      padding: "10px 14px", fontSize: 12, color: t.text, boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
    }}>
      <p style={{ margin: "0 0 6px", fontWeight: 600 }}>{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ margin: "2px 0", color: p.color }}>
          {p.name}: <strong>{typeof p.value === "number" && p.name !== "Profitto (€)" ? p.value : `€${p.value}`}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────────
export default function Dashboard() {
  const [dark, setDark] = useState(false);
  const [nav, setNav] = useState("dashboard");
  const t = getTheme(dark);

  return (
    <div style={{
      display: "flex", height: "100vh", background: t.bg, color: t.text,
      fontFamily: "'DM Sans', 'Segoe UI', system-ui, sans-serif",
      overflow: "hidden",
    }}>
      {/* ── Sidebar ── */}
      <div style={{
        width: 220, flexShrink: 0, background: t.surface,
        borderRight: `1px solid ${t.border}`, display: "flex",
        flexDirection: "column", padding: "20px 12px",
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "4px 10px 24px" }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10, background: t.accent,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Zap size={18} color="#fff" fill="#fff" />
          </div>
          <div>
            <p style={{ margin: 0, fontWeight: 700, fontSize: 15, color: t.text }}>LX</p>
            <p style={{ margin: 0, fontSize: 10, color: t.textMuted }}>Gestionale</p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1 }}>
          <p style={{ margin: "0 0 8px 14px", fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Principale</p>
          {[
            { id: "dashboard", icon: LayoutDashboard, label: "Dashboard" },
            { id: "ricariche", icon: Smartphone, label: "Ricariche" },
            { id: "fatture", icon: FileText, label: "Fatture" },
            { id: "tariffe", icon: Tag, label: "Tariffe" },
          ].map((item) => (
            <NavItem key={item.id} {...item} active={nav === item.id} t={t} onClick={() => setNav(item.id)} />
          ))}
          <p style={{ margin: "16px 0 8px 14px", fontSize: 10, fontWeight: 600, color: t.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>Gestione</p>
          {[
            { id: "negozi", icon: Store, label: "Boutique" },
            { id: "dipendenti", icon: Users, label: "Dipendenti" },
          ].map((item) => (
            <NavItem key={item.id} {...item} active={nav === item.id} t={t} onClick={() => setNav(item.id)} />
          ))}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: `1px solid ${t.border}`, paddingTop: 12 }}>
          <NavItem icon={Settings} label="Impostazioni" active={false} t={t} />
          <NavItem icon={LogOut} label="Logout" active={false} t={t} />
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px 0" }}>
            <div style={{
              width: 32, height: 32, borderRadius: "50%", background: t.accent,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#fff", fontWeight: 700, fontSize: 13,
            }}>A</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.text }}>Admin</p>
              <p style={{ margin: 0, fontSize: 11, color: t.textMuted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>admin@lxgestionale.it</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>

        {/* Header */}
        <div style={{
          background: t.surface, borderBottom: `1px solid ${t.border}`,
          padding: "14px 24px", display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
        }}>
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 18, fontWeight: 700, color: t.text }}>Dashboard</p>
            <p style={{ margin: 0, fontSize: 12, color: t.textMuted }}>Giovedì 21 Maggio 2026</p>
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 8, background: t.surface2,
            border: `1px solid ${t.border}`, borderRadius: 10, padding: "7px 12px",
          }}>
            <Search size={14} color={t.textMuted} />
            <span style={{ fontSize: 13, color: t.textMuted }}>Cerca operazione…</span>
          </div>
          <button
            onClick={() => setDark(!dark)}
            style={{
              width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.border}`,
              background: t.surface2, cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center", color: t.textMuted,
            }}
          >
            {dark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <div style={{
            width: 36, height: 36, borderRadius: 10, border: `1px solid ${t.border}`,
            background: t.surface2, cursor: "pointer", display: "flex",
            alignItems: "center", justifyContent: "center", color: t.textMuted, position: "relative",
          }}>
            <Bell size={16} />
            <div style={{
              position: "absolute", top: 7, right: 7, width: 7, height: 7,
              borderRadius: "50%", background: t.red, border: `1.5px solid ${t.surface}`,
            }} />
          </div>
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: "auto", padding: 24, display: "flex", gap: 20 }}>

          {/* ── Left/Main ── */}
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 20 }}>

            {/* Stats row */}
            <div style={{ display: "flex", gap: 14 }}>
              <StatCard label="Operazioni Oggi" value="247" trend={+8} icon={Activity} t={t} />
              <StatCard label="Profitto Oggi" value="€389" trend={+12} icon={Euro} t={t} />
              <StatCard label="Ricariche Mese" value="1.842" trend={+5} icon={Smartphone} t={t} />
              <StatCard label="Fatture Pendenti" value="12" trend={-3} icon={FileText} t={t} />
            </div>

            {/* Charts row */}
            <div style={{ display: "flex", gap: 14 }}>
              {/* Bar chart */}
              <div style={{
                flex: 2, background: t.surface, border: `1px solid ${t.border}`,
                borderRadius: 16, padding: "20px 20px 14px",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.text }}>Ricariche per Operatore</p>
                    <p style={{ margin: "2px 0 0", fontSize: 12, color: t.textMuted }}>Ultimi 5 mesi</p>
                  </div>
                  <span style={{ fontSize: 12, color: t.textMuted }}>2026</span>
                </div>
                {/* Legend */}
                <div style={{ display: "flex", gap: 16, margin: "10px 0 14px", flexWrap: "wrap" }}>
                  {["TIM", "Vodafone", "Iliad", "WindTre"].map((op, i) => (
                    <span key={op} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: t.textMuted }}>
                      <span style={{ width: 10, height: 10, borderRadius: 3, background: t.barColors[i] }} />
                      {op}
                    </span>
                  ))}
                </div>
                <div style={{ position: "relative", width: "100%", height: 180 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ricaricheMensili} barSize={8} barGap={3}>
                      <CartesianGrid strokeDasharray="3 3" stroke={t.chartGrid} vertical={false} />
                      <XAxis dataKey="mese" tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: t.textMuted }} axisLine={false} tickLine={false} />
                      <Tooltip content={<CustomTooltip t={t} />} />
                      <Bar dataKey="tim" name="TIM" fill={t.barColors[0]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="vodafone" name="Vodafone" fill={t.barColors[1]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="iliad" name="Iliad" fill={t.barColors[2]} radius={[4, 4, 0, 0]} />
                      <Bar dataKey="wind" name="WindTre" fill={t.barColors[3]} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Area chart */}
              <div style={{
                flex: 1, background: t.accentLight, border: `1px solid ${t.border}`,
                borderRadius: 16, padding: "20px 20px 14px",
              }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.text }}>Andamento Profitto</p>
                <p style={{ margin: "2px 0 0", fontSize: 12, color: t.textMuted }}>Questa settimana</p>
                <p style={{ margin: "12px 0 0", fontSize: 32, fontWeight: 800, color: t.accent, letterSpacing: "-0.04em" }}>€1.711</p>
                <p style={{ margin: "2px 0 14px", fontSize: 12, color: t.green, fontWeight: 600 }}>▲ +18.4% vs settimana scorsa</p>
                <div style={{ position: "relative", width: "100%", height: 100 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={profittoSettimanale}>
                      <defs>
                        <linearGradient id="profGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={t.accent} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={t.accent} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Tooltip content={<CustomTooltip t={t} />} />
                      <Area type="monotone" dataKey="profitto" name="Profitto (€)" stroke={t.accent} strokeWidth={2} fill="url(#profGrad)" dot={false} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Operations table */}
            <div style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 16, overflow: "hidden",
            }}>
              <div style={{
                padding: "16px 20px", display: "flex",
                justifyContent: "space-between", alignItems: "center",
                borderBottom: `1px solid ${t.border}`,
              }}>
                <div>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.text }}>Ultime Operazioni</p>
                  <p style={{ margin: "1px 0 0", fontSize: 12, color: t.textMuted }}>Operazioni di oggi</p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                    borderRadius: 8, border: `1px solid ${t.border}`, background: "transparent",
                    color: t.textMuted, cursor: "pointer", fontSize: 12,
                  }}>
                    <RefreshCw size={12} /> Aggiorna
                  </button>
                  <button style={{
                    display: "flex", alignItems: "center", gap: 6, padding: "6px 12px",
                    borderRadius: 8, border: "none", background: t.accent,
                    color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>
                    <Plus size={12} /> Nuova Ricarica
                  </button>
                </div>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: t.surface2 }}>
                    {["Tipo", "Cliente", "Operatore", "Ora", "Importo", "Profitto", "Stato"].map((h) => (
                      <th key={h} style={{
                        padding: "10px 16px", textAlign: "left", fontWeight: 600,
                        fontSize: 11, color: t.textMuted, letterSpacing: "0.04em",
                        textTransform: "uppercase", borderBottom: `1px solid ${t.border}`,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ultimeOperazioni.map((op, i) => (
                    <tr key={op.id} style={{
                      borderBottom: i < ultimeOperazioni.length - 1 ? `1px solid ${t.border}` : "none",
                      transition: "background 0.1s",
                    }}
                      onMouseEnter={e => e.currentTarget.style.background = t.surface2}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: op.tipo === "Ricarica" ? t.accent : t.amber,
                          background: op.tipo === "Ricarica" ? t.accentLight : t.amberBg,
                          borderRadius: 6, padding: "2px 8px",
                        }}>{op.tipo}</span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 500 }}>{op.cliente}</td>
                      <td style={{ padding: "12px 16px" }}><OperatoreBadge nome={op.operatore} /></td>
                      <td style={{ padding: "12px 16px", color: t.textMuted }}>{op.ora}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: t.green }}>{op.importo}</td>
                      <td style={{ padding: "12px 16px", fontWeight: 600, color: t.textMuted }}>{op.profitto}</td>
                      <td style={{ padding: "12px 16px" }}><StatusBadge stato={op.stato} t={t} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Right Panel ── */}
          <div style={{ width: 280, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>

            {/* Boutique list */}
            <div style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 16, padding: "18px 18px 10px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.text }}>Le tue Boutique</p>
                <ChevronRight size={16} color={t.textMuted} />
              </div>
              {boutique.map((b, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "10px 0",
                  borderBottom: i < boutique.length - 1 ? `1px solid ${t.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 34, height: 34, borderRadius: 9, background: t.accentLight,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Store size={15} color={t.accent} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: t.text }}>{b.nome}</p>
                      <p style={{ margin: 0, fontSize: 11, color: t.textMuted }}>{b.operazioni} operazioni</p>
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: t.text }}>{b.profitto}</p>
                    <p style={{ margin: 0, fontSize: 11, color: b.trend >= 0 ? t.green : t.red, fontWeight: 600 }}>
                      {b.trend >= 0 ? "▲" : "▼"} {Math.abs(b.trend)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Tariffe attive */}
            <div style={{
              background: t.surface, border: `1px solid ${t.border}`,
              borderRadius: 16, padding: "18px 18px 10px",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: t.text }}>Tariffe Attive</p>
                <button style={{
                  display: "flex", alignItems: "center", gap: 4, padding: "4px 10px",
                  borderRadius: 7, border: `1px solid ${t.border}`, background: "transparent",
                  color: t.textMuted, cursor: "pointer", fontSize: 11,
                }}>
                  <Plus size={11} /> Aggiungi
                </button>
              </div>
              {tariffe.map((t2, i) => (
                <div key={i} style={{
                  display: "flex", justifyContent: "space-between", alignItems: "center",
                  padding: "9px 0",
                  borderBottom: i < tariffe.length - 1 ? `1px solid ${t.border}` : "none",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <OperatoreBadge nome={t2.operatore} />
                    <span style={{ fontSize: 12, color: t.textMuted }}>{t2.giga} GB</span>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: t.text }}>{t2.vendita}</p>
                    <p style={{ margin: 0, fontSize: 11, color: t.green, fontWeight: 600 }}>+{t2.margine}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Quick recharge */}
            <div style={{
              background: `linear-gradient(135deg, ${t.accent}, #8B5CF6)`,
              borderRadius: 16, padding: 18,
            }}>
              <p style={{ margin: "0 0 4px", fontSize: 14, fontWeight: 700, color: "#fff" }}>Ricarica Rapida</p>
              <p style={{ margin: "0 0 14px", fontSize: 12, color: "rgba(255,255,255,0.75)" }}>Inserisci numero e importo</p>
              <input
                type="tel"
                placeholder="Numero di telefono"
                style={{
                  width: "100%", padding: "9px 12px", borderRadius: 9, border: "none",
                  background: "rgba(255,255,255,0.15)", color: "#fff", fontSize: 13,
                  outline: "none", marginBottom: 8, boxSizing: "border-box",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                {["€10", "€20", "€30", "€50"].map((v) => (
                  <button key={v} style={{
                    flex: 1, padding: "7px 0", borderRadius: 7,
                    border: "1.5px solid rgba(255,255,255,0.35)",
                    background: "rgba(255,255,255,0.1)", color: "#fff",
                    cursor: "pointer", fontSize: 12, fontWeight: 600,
                  }}>{v}</button>
                ))}
              </div>
              <button style={{
                width: "100%", marginTop: 10, padding: "10px 0", borderRadius: 9,
                border: "none", background: "#fff", color: t.accent,
                fontWeight: 700, fontSize: 13, cursor: "pointer",
              }}>
                Procedi Ricarica →
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
