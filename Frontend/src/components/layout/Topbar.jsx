import { useNavigate } from "react-router-dom";
import { ChevronDown, LogOut, Menu } from "lucide-react";
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
import { useTheme } from "@/context/ThemeContext";

const RUOLO_BADGE = {
  DIPENDENTE:  { label: "Dipendente",  className: "bg-sky-50 text-sky-700 ring-1 ring-sky-200 dark:bg-sky-400/10 dark:text-sky-300 dark:ring-sky-400/20" },
  ADMIN:       { label: "Admin",       className: "brand-soft ring-1 ring-[var(--brand-border)]" },
  SUPER_ADMIN: { label: "Super Admin", className: "bg-violet-50 text-violet-700 ring-1 ring-violet-200 dark:bg-violet-400/10 dark:text-violet-300 dark:ring-violet-400/20" },
};

export default function Topbar({ onMenuClick }) {
  const { utente, logout, boutiqueName } = useAuth();
  const { brandName, setBrandName, brandPalettes } = useTheme();
  const navigate = useNavigate();
  const iniziali = utente?.username?.slice(0, 2).toUpperCase() ?? "??";
  const badge = RUOLO_BADGE[utente?.ruolo] ?? { label: utente?.ruolo, className: "" };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-stone-200/80 bg-white/85 px-4 shadow-sm backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/80">

      {/* Sinistra: hamburger solo mobile */}
      <button
        onClick={onMenuClick}
        className="flex md:hidden items-center justify-center rounded-lg p-1.5 text-stone-500 hover:bg-stone-100 hover:text-stone-900 dark:text-stone-400 dark:hover:bg-stone-900 dark:hover:text-stone-100 transition-colors cursor-pointer"
        aria-label="Apri menu"
      >
        <Menu size={20} />
      </button>

      {/* Spacer — su md+ la sinistra è vuota */}
      <div className="hidden md:block" />

      {/* Destra: toggle tema + badge boutique + avatar dropdown */}
      <div className="flex items-center gap-3">
        {boutiqueName && (
          <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-stone-200 bg-stone-50 px-3 py-1 text-xs font-medium text-stone-600 shadow-sm select-none dark:border-stone-800 dark:bg-stone-900 dark:text-stone-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {boutiqueName}
          </span>
        )}
        <ThemeToggle />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors group cursor-pointer hover:border-stone-200 hover:bg-stone-50 dark:hover:border-stone-800 dark:hover:bg-stone-900">
              {/* Avatar cerchio */}
              <span className="brand-primary flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-2 ring-transparent transition-shadow group-hover:ring-[var(--brand-ring)]">
                {iniziali}
              </span>
              <ChevronDown size={14} className="text-stone-400 dark:text-stone-500" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56 rounded-xl border-stone-200 bg-white p-2 shadow-md dark:border-stone-800 dark:bg-stone-900">
            <DropdownMenuLabel className="flex flex-col gap-1 pb-2">
              <span className="text-sm font-medium text-stone-900 dark:text-stone-50">
                {utente?.username}
              </span>
              <span className={`w-fit rounded-full px-2 py-0.5 text-xs font-medium ${badge.className}`}>
                {badge.label}
              </span>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <div className="px-2 py-3">
              <div className="space-y-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-widest text-stone-400 dark:text-stone-500">
                  Palette
                </p>
                <div className="flex items-center justify-center gap-3">
                  {brandPalettes.map((palette) => {
                    const active = palette.id === brandName;
                    return (
                      <button
                        key={palette.id}
                        type="button"
                        onClick={() => setBrandName(palette.id)}
                        title={palette.label}
                        aria-label={`Usa palette ${palette.label}`}
                        aria-pressed={active}
                        className={[
                          "relative flex h-9 w-9 items-center justify-center rounded-full border transition-all cursor-pointer",
                          active
                            ? "border-[var(--brand-primary)] bg-[var(--brand-soft)] ring-2 ring-[var(--brand-ring)] shadow-[0_10px_22px_-18px_var(--brand-shadow)]"
                            : "border-stone-200 bg-white hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] dark:border-stone-800 dark:bg-stone-900 dark:hover:border-[var(--brand-border)] dark:hover:bg-[var(--brand-soft)]",
                        ].join(" ")}
                      >
                        <span
                          className="h-[18px] w-[18px] rounded-full ring-1 ring-black/10 dark:ring-white/15"
                          style={{ backgroundColor: palette.swatch }}
                        />
                        <span className="sr-only">{palette.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg text-red-500 dark:text-red-400 focus:text-red-600 dark:focus:text-red-300 focus:bg-red-50 dark:focus:bg-red-900/20 cursor-pointer"
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
