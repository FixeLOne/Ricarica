import { motion } from "framer-motion";
import { formatOra } from "@/lib/operatori";

const DOT_COLORS = {
  OOREDOO: "#E30613",
  ORANGE:  "#FF6600",
  TELECOM: "#003DA5",
  FISSO:   "#0891b2",
};

export default function UltimeRicariche({ ricariche, flashId, loading }) {
  const ultimi = ricariche.slice(0, 8);

  return (
    <div className="bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
      <div className="px-4 pt-3 pb-2.5 border-b border-stone-100 dark:border-stone-700">
        <p className="text-xs font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-wide">
          Ultime ricariche
        </p>
      </div>

      {loading ? (
        <p className="px-4 py-6 text-xs text-stone-400 dark:text-stone-500 text-center">Caricamento…</p>
      ) : ultimi.length === 0 ? (
        <p className="px-4 py-6 text-xs text-stone-400 dark:text-stone-500 text-center">Nessuna ancora.</p>
      ) : (
        <ul>
          {ultimi.map((r, i) => {
            const op = r.operatore?.toUpperCase();
            const dotColor = DOT_COLORS[op] ?? "#a8a29e";
            return (
              <motion.li
                key={r.id}
                initial={flashId === r.id ? { backgroundColor: "rgba(34,197,94,0.25)" } : false}
                animate={{ backgroundColor: "rgba(0,0,0,0)" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className={`flex items-center gap-2.5 px-4 py-2.5${
                  i < ultimi.length - 1 ? " border-b border-stone-50 dark:border-stone-700/50" : ""
                }`}
              >
                <span className="text-xs tabular-nums text-stone-400 dark:text-stone-500 w-10 shrink-0">
                  {formatOra(r.dataOra)}
                </span>
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="font-mono text-xs text-stone-800 dark:text-stone-200 tracking-wide flex-1">
                  {r.numero}
                </span>
                <span className="text-xs font-medium text-stone-500 dark:text-stone-400 tabular-nums shrink-0">
                  {parseFloat(r.giga)} GB
                </span>
              </motion.li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
