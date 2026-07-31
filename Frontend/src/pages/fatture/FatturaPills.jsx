import { FileText } from "lucide-react";

import {
  getStatoLabel,
  getTipoLabel,
  STATO_OPTIONS,
  STATO_STYLE,
} from "./fattureListHelpers";

export function StatusPill({ stato }) {
  const Icon = STATO_OPTIONS.find((item) => item.value === stato)?.icon ?? FileText;

  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${STATO_STYLE[stato] ?? STATO_STYLE.BOZZA}`}>
      <Icon className="h-3.5 w-3.5" />
      {getStatoLabel(stato)}
    </span>
  );
}

export function TypePill({ tipo }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 text-xs font-semibold text-[var(--brand-text)]">
      {getTipoLabel(tipo)}
    </span>
  );
}

export function SummaryTile({ label, value, hint, highlighted = false, icon: Icon }) {
  return (
    <div
      className={[
        "rounded-2xl border p-4",
        highlighted
          ? "border-[var(--brand-border)] bg-[var(--brand-soft)]"
          : "border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-3">
        <p className={highlighted ? "text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]" : "text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500"}>
          {label}
        </p>
        <Icon className={highlighted ? "h-4 w-4 text-[var(--brand-text)]" : "h-4 w-4 text-stone-400 dark:text-stone-500"} />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-stone-950 dark:text-stone-50">{value}</p>
      <p className="mt-1 text-xs text-stone-500 dark:text-stone-400">{hint}</p>
    </div>
  );
}
