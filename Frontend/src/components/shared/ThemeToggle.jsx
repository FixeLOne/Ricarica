import { AnimatePresence, motion } from "framer-motion";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { cn } from "@/lib/utils";

export default function ThemeToggle({ className = "" }) {
  const { themeName, toggleTheme } = useTheme();
  const isDark = themeName === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
      className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full",
        "bg-white dark:bg-stone-900",
        "border border-stone-200/80 dark:border-stone-800",
        "shadow-[0_10px_25px_-20px_rgba(15,23,42,0.55)] backdrop-blur-sm",
        "text-stone-500 dark:text-stone-400",
        "hover:text-[var(--brand-text)]",
        "hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] dark:hover:border-[var(--brand-border)] dark:hover:bg-[var(--brand-soft)]",
        "transition-colors duration-150 cursor-pointer",
        className
      )}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.span
            key="moon"
            initial={{ rotate: -90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: 90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute"
          >
            <Moon size={16} />
          </motion.span>
        ) : (
          <motion.span
            key="sun"
            initial={{ rotate: 90, scale: 0.5, opacity: 0 }}
            animate={{ rotate: 0, scale: 1, opacity: 1 }}
            exit={{ rotate: -90, scale: 0.5, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute"
          >
            <Sun size={16} />
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
