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
        "bg-white/80 dark:bg-stone-800/80",
        "border border-amber-200/60 dark:border-stone-700/60",
        "shadow-sm backdrop-blur-sm",
        "text-stone-500 dark:text-stone-400",
        "hover:text-amber-600 dark:hover:text-amber-400",
        "hover:border-amber-300 dark:hover:border-amber-500/50",
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
