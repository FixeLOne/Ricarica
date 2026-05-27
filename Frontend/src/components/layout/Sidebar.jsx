import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Zap, FileText, Tag,
  Store, Download, Building2, Users, LogOut,
  PanelLeft, PanelLeftClose,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import BrandMark from "@/components/shared/BrandMark";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard",         path: "/dashboard",      icon: LayoutDashboard, ruoli: ["DIPENDENTE", "ADMIN", "SUPER_ADMIN"] },
  { label: "Ricariche",         path: "/ricariche",      icon: Zap,             ruoli: ["DIPENDENTE", "ADMIN", "SUPER_ADMIN"] },
  { label: "Fatture",           path: "/fatture",        icon: FileText,        ruoli: ["DIPENDENTE", "ADMIN", "SUPER_ADMIN"] },
  { label: "Tariffe",           path: "/tariffe",        icon: Tag,             ruoli: ["ADMIN", "SUPER_ADMIN"] },
  { label: "Boutique",          path: "/boutique",       icon: Store,           ruoli: ["ADMIN"] },
  { label: "Tutte le boutique", path: "/boutique/tutte", icon: Store,           ruoli: ["SUPER_ADMIN"] },
  { label: "Export",            path: "/export",         icon: Download,        ruoli: ["ADMIN", "SUPER_ADMIN"] },
  { label: "Azienda",           path: "/azienda",        icon: Building2,       ruoli: ["ADMIN"] },
  { label: "Gestione Admin",    path: "/admin-list",     icon: Users,           ruoli: ["SUPER_ADMIN"] },
];

// ── NavItem ────────────────────────────────────────────────────────────────
// Icona sempre a pl-3 — non si muove mai durante il collasso.
// Il label fa solo opacity fade (niente x-shift) per non disturbare l'icona.

function NavItem({ item, collapsed, onClick }) {
  const { pathname } = useLocation();
  const isActive = pathname === item.path;

  return (
    <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1, ease: "easeOut" }}>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <NavLink
            to={item.path}
            onClick={onClick}
            className={cn(
              "flex flex-row items-center w-full rounded-xl py-2.5 pl-3 gap-3",
              "text-sm font-medium transition-all duration-150 overflow-hidden",
              isActive
                ? "brand-soft font-semibold border-l-2 border-[var(--brand-primary)] pl-[10px]"
                : "text-stone-600 hover:bg-stone-100 hover:text-stone-950 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100",
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  {item.label}
                </motion.span>
              )}
            </AnimatePresence>
          </NavLink>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-800 shadow-lg dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100">
            {item.label}
          </TooltipContent>
        )}
      </Tooltip>
    </motion.div>
  );
}

// ── LogoutItem ─────────────────────────────────────────────────────────────

function LogoutItem({ collapsed, onClick }) {
  return (
    <motion.div whileTap={{ scale: 0.95 }} transition={{ duration: 0.1, ease: "easeOut" }}>
      <Tooltip delayDuration={400}>
        <TooltipTrigger asChild>
          <button
            onClick={onClick}
            className={cn(
              "flex flex-row items-center w-full rounded-xl py-2.5 pl-3 gap-3",
              "text-sm font-medium transition-all duration-150 cursor-pointer overflow-hidden",
              "text-stone-500 hover:bg-red-50 hover:text-red-600 dark:text-stone-400 dark:hover:bg-red-500/10 dark:hover:text-red-300",
            )}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.span
                  key="label"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12, ease: "easeOut" }}
                  className="whitespace-nowrap overflow-hidden"
                >
                  Esci
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </TooltipTrigger>
        {collapsed && (
          <TooltipContent side="right" className="rounded-md border border-stone-200 bg-white px-2 py-1 text-xs text-stone-800 shadow-lg dark:border-stone-700 dark:bg-stone-800 dark:text-stone-100">
            Esci
          </TooltipContent>
        )}
      </Tooltip>
    </motion.div>
  );
}

// ── SidebarContent ─────────────────────────────────────────────────────────
// onToggle: presente solo su desktop — su mobile undefined → bottone nascosto
// onNavClick: chiude il drawer mobile su nav click e click logo

function SidebarContent({ collapsed = false, onToggle, onNavClick }) {
  const { utente, logout } = useAuth();
  const navigate = useNavigate();
  const voci = NAV_ITEMS.filter((item) => item.ruoli.includes(utente?.ruolo));

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex h-full flex-col overflow-hidden border-r border-stone-200/80 bg-white/95 text-stone-950 shadow-[10px_0_30px_-28px_rgba(15,23,42,0.45)] dark:border-stone-800 dark:bg-stone-950 dark:text-stone-50">

      {/* Header: logo + toggle — sempre flex items-center justify-between */}
      <div className="flex flex-row items-center justify-between h-14 border-b border-stone-200/70 shrink-0 px-3 dark:border-stone-800">
        {collapsed ? (
          /* Collassata: PanelLeft centrato */
          <button
            onClick={onToggle}
            aria-label="Espandi sidebar"
            className="flex items-center justify-center w-5 h-5 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer mx-auto dark:text-stone-500 dark:hover:text-stone-100"
          >
            <PanelLeft className="w-5 h-5" />
          </button>
        ) : (
          /* Espansa: logo a sinistra, PanelLeftClose a destra */
          <>
            <NavLink
              to="/dashboard"
              onClick={onNavClick}
              className="flex flex-row items-center gap-2 min-w-0"
            >
              <BrandMark size="md" />
              <motion.span
                key="brand"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="text-base font-semibold text-stone-950 whitespace-nowrap overflow-hidden dark:text-stone-100"
              >
                RechargeNet
              </motion.span>
            </NavLink>
            {onToggle && (
              <button
                onClick={onToggle}
                aria-label="Comprimi sidebar"
                className="flex items-center justify-center w-5 h-5 text-stone-400 hover:text-stone-900 transition-colors shrink-0 cursor-pointer dark:text-stone-500 dark:hover:text-stone-100"
              >
                <PanelLeftClose className="w-5 h-5" />
              </button>
            )}
          </>
        )}
      </div>

      {/* Navigazione */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <TooltipProvider>
          {voci.map((item) => (
            <NavItem
              key={item.path}
              item={item}
              collapsed={collapsed}
              onClick={onNavClick}
            />
          ))}
        </TooltipProvider>
      </nav>

      {/* Footer: separatore + esci */}
      <div className="px-2 pb-3 shrink-0 space-y-1">
        <Separator className="bg-stone-200/80 dark:bg-stone-800" />
        <TooltipProvider>
          <LogoutItem collapsed={collapsed} onClick={handleLogout} />
        </TooltipProvider>
      </div>

    </div>
  );
}

// ── Sidebar (export default) ───────────────────────────────────────────────

export default function Sidebar({ mobileOpen, onMobileClose }) {
  const [desktopCollapsed, setDesktopCollapsed] = useState(
    () => localStorage.getItem("sidebar-collapsed") === "true"
  );

  const toggleDesktop = () => {
    setDesktopCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar-collapsed", String(next));
      return next;
    });
  };

  return (
    <>
      {/* ── Desktop md+lg: larghezza animata 220 ↔ 64 ── */}
      <motion.aside
        className="hidden md:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden"
        animate={{ width: desktopCollapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <SidebarContent collapsed={desktopCollapsed} onToggle={toggleDesktop} />
      </motion.aside>

      {/* ── Mobile: Sheet drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-stone-950/45 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onMobileClose}
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 w-64 md:hidden"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
            >
              {/* collapsed=false sempre, onToggle=undefined → bottone nascosto */}
              <SidebarContent onNavClick={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
