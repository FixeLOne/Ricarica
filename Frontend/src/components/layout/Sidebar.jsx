import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, Zap, FileText, Tag,
  Store, Download, Building2, Users, LogOut, X,
  ChevronLeft, ChevronRight,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import logo from "@/logo.png";

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
            "flex flex-row items-center w-full rounded-lg py-2.5 text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "gap-3 px-3",
            isActive
              ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/15 hover:text-amber-300"
              : "text-stone-400 hover:text-stone-100 hover:bg-stone-800",
          )}
        >
          <item.icon className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <AnimatePresence initial={false}>
              <motion.span
                key="label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="whitespace-nowrap overflow-hidden"
              >
                {item.label}
              </motion.span>
            </AnimatePresence>
          )}
        </NavLink>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right" className="bg-stone-800 text-stone-100 border-0 shadow-none text-xs px-2 py-1 rounded-md">{item.label}</TooltipContent>}
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
            "flex flex-row items-center w-full rounded-lg py-2.5 text-sm font-medium transition-colors",
            collapsed ? "justify-center px-0" : "gap-3 px-3",
            "text-stone-400 hover:text-red-400 hover:bg-red-500/10",
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && (
            <AnimatePresence initial={false}>
              <motion.span
                key="label"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="whitespace-nowrap overflow-hidden"
              >
                Esci
              </motion.span>
            </AnimatePresence>
          )}
        </button>
      </TooltipTrigger>
      {collapsed && <TooltipContent side="right" className="bg-stone-800 text-stone-100 border-0 shadow-none text-xs px-2 py-1 rounded-md">Esci</TooltipContent>}
    </Tooltip>
    </motion.div>
  );
}

// ── ToggleTab ──────────────────────────────────────────────────────────────

function ToggleTab({ collapsed, onToggle }) {
  return (
    <button
      onClick={onToggle}
      aria-label={collapsed ? "Espandi sidebar" : "Comprimi sidebar"}
      className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-full z-10
        bg-stone-800 hover:bg-stone-700 rounded-r-md py-3 px-1
        text-stone-400 hover:text-stone-200 transition-colors"
    >
      {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
    </button>
  );
}

// ── SidebarContent ─────────────────────────────────────────────────────────

function SidebarContent({ collapsed = false, onNavClick }) {
  const { utente, logout } = useAuth();
  const navigate = useNavigate();
  const voci = NAV_ITEMS.filter((item) => item.ruoli.includes(utente?.ruolo));

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="flex flex-col h-full bg-stone-900 dark:bg-stone-950 overflow-hidden">

      {/* Logo / brand */}
      <NavLink
        to="/dashboard"
        className={cn(
          "flex flex-row items-center gap-2 h-14 border-b border-stone-800 px-4 shrink-0",
          collapsed && "justify-center px-2",
        )}
      >
        <img src={logo} alt="RechargeNet" className="h-5 w-5 shrink-0" />
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              key="brand"
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -6 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="text-base font-semibold text-stone-100 whitespace-nowrap overflow-hidden"
            >
              RechargeNet
            </motion.span>
          )}
        </AnimatePresence>
      </NavLink>

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
        <Separator className="bg-stone-800" />
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
      {/* ── Desktop lg: larghezza animata 220 ↔ 64 ── */}
      <motion.aside
        className="hidden lg:flex flex-col h-screen sticky top-0 shrink-0 relative"
        animate={{ width: desktopCollapsed ? 64 : 220 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <SidebarContent collapsed={desktopCollapsed} />
        <ToggleTab collapsed={desktopCollapsed} onToggle={toggleDesktop} />
      </motion.aside>

      {/* ── Desktop md: sempre collassata a 64px ── */}
      <motion.aside
        className="hidden md:flex lg:hidden flex-col h-screen sticky top-0 shrink-0 overflow-hidden"
        animate={{ width: 64 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
      >
        <SidebarContent collapsed />
      </motion.aside>

      {/* ── Mobile: Sheet drawer ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="overlay"
              className="fixed inset-0 z-40 bg-black/50 md:hidden"
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
              <button
                onClick={onMobileClose}
                className="absolute right-3 top-3.5 z-10 rounded-md p-1 text-stone-400 hover:text-stone-100 transition-colors"
                aria-label="Chiudi menu"
              >
                <X size={18} />
              </button>
              <SidebarContent onNavClick={onMobileClose} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
