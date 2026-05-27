const DOT = { OOREDOO: "#E30613", ORANGE: "#FF6600", TELECOM: "#003DA5", FISSO: "#0891b2" };

function BarraOperatore({ nome, count, max }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  const key = nome?.toUpperCase?.() ?? "";
  return (
    <div className="flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: DOT[key] ?? "#a8a29e" }} />
      <span className="text-xs text-stone-600 dark:text-stone-300 w-16 truncate capitalize">
        {key.charAt(0) + key.slice(1).toLowerCase()}
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-stone-100 dark:bg-stone-700 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: DOT[key] ?? "#a8a29e" }} />
      </div>
      <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 tabular-nums w-4 text-right">{count}</span>
    </div>
  );
}

export default function StatsPanel({ stats }) {
  if (!stats) return null;

  const { countOggi, countIeri, gbTotali, perOperatore } = stats;
  const delta = countOggi - countIeri;
  const maxOp = Math.max(...Object.values(perOperatore ?? {}), 1);

  const card = "rounded-xl border border-stone-200/80 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900";

  return (
    <div className="flex flex-col gap-3 w-[200px] shrink-0 self-start sticky top-4">

      {/* Ricariche oggi */}
      <div className={card}>
        <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2">Oggi</p>
        <p className="text-[10px] text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-0.5">Ricariche</p>
        <p className="text-3xl font-bold text-[var(--brand-text)] tabular-nums leading-none">{countOggi}</p>
        {delta !== 0 && (
          <p className={`text-[11px] font-medium mt-1 ${delta > 0 ? "text-emerald-500" : "text-red-400"}`}>
            {delta > 0 ? `+${delta}` : delta} rispetto a ieri
          </p>
        )}
      </div>

      {/* GB totali */}
      <div className={card}>
        <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-2">GB Totali</p>
        <p className="text-2xl font-bold text-stone-800 dark:text-stone-100 tabular-nums leading-none">
          {gbTotali % 1 === 0 ? gbTotali : gbTotali.toFixed(1)} <span className="text-base font-medium text-stone-400">GB</span>
        </p>
      </div>

      {/* Operatori */}
      {perOperatore && Object.keys(perOperatore).length > 0 && (
        <div className={card}>
          <p className="text-[10px] font-semibold text-stone-500 dark:text-stone-400 uppercase tracking-widest mb-3">Operatori</p>
          <div className="flex flex-col gap-2.5">
            {Object.entries(perOperatore)
              .sort((a, b) => b[1] - a[1])
              .map(([op, cnt]) => (
                <BarraOperatore key={op} nome={op} count={cnt} max={maxOp} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
