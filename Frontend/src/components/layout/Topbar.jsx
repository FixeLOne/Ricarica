import { useNavigate } from "react-router-dom";
import { Menu, LogOut, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ThemeToggle from "@/components/shared/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

const RUOLO_BADGE = {
  DIPENDENTE:  { label: "Dipendente",  className: "bg-blue-500/15 text-blue-400" },
  ADMIN:       { label: "Admin",       className: "bg-amber-500/15 text-amber-500" },
  SUPER_ADMIN: { label: "Super Admin", className: "bg-purple-500/15 text-purple-400" },
};

export default function Topbar({ onMenuClick }) {
  const { utente, logout } = useAuth();
  const navigate = useNavigate();

  const iniziali = utente?.username?.slice(0, 2).toUpperCase() ?? "??";
  const badge = RUOLO_BADGE[utente?.ruolo] ?? { label: utente?.ruolo, className: "" };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-amber-200/60 dark:border-stone-700 bg-white dark:bg-stone-800 px-4 shadow-sm">

      {/* Sinistra: hamburger solo mobile */}
      <button
        onClick={onMenuClick}
        className="flex md:hidden items-center justify-center rounded-md p-1.5 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 transition-colors"
        aria-label="Apri menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer — su md+ la sinistra è vuota */}
      <div className="hidden md:block" />

      {/* Destra: toggle tema + avatar dropdown */}
      <div className="flex items-center gap-3">
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full pl-1 pr-2 py-1 hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors group">
              {/* Avatar cerchio */}
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-semibold text-white ring-2 ring-transparent group-hover:ring-amber-400/30 transition-shadow">
                {iniziali}
              </span>
              <ChevronDown size={14} className="text-stone-400 dark:text-stone-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel className="flex flex-col gap-1 pb-2">
              <span className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {utente?.username}
              </span>
              <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
            >
              <LogOut size={14} />
              Esci
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
