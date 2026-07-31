import { FilePenLine, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ALL_VALUE, STATO_OPTIONS, TIPO_OPTIONS } from "./fattureListHelpers";

export default function FattureFilters({
  filtri,
  onChange,
  onReset,
  filtriOpen,
  onToggleOpen,
  hasFilters,
  activeCount,
  boutiques,
  canFilterBoutique,
  pageLabel,
}) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:items-center">
          <div className="relative w-full md:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={filtri.query}
              onChange={(event) => onChange({ query: event.target.value })}
              placeholder="Cerca numero, cliente o boutique"
              className="h-10 rounded-xl border-stone-200 bg-stone-50 pl-9 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
            />
          </div>

          <div className="grid grid-cols-4 gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-stone-950/35 md:w-[380px]">
            {STATO_OPTIONS.map((option) => {
              const Icon = option.icon;
              const active = filtri.stato === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => onChange({ stato: option.value })}
                  className={[
                    "inline-flex h-8 items-center justify-center gap-1 rounded-lg px-2 text-xs font-semibold transition-colors",
                    active
                      ? "bg-white text-[var(--brand-text)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-stone-900"
                      : "text-stone-500 hover:bg-white hover:text-[var(--brand-text)] dark:text-stone-400 dark:hover:bg-stone-900",
                  ].join(" ")}
                >
                  <Icon className="hidden h-3.5 w-3.5 sm:block" />
                  {option.label}
                </button>
              );
            })}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onToggleOpen}
            className={[
              "h-10 rounded-xl px-3 text-sm font-semibold shadow-none",
              filtriOpen || hasFilters
                ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]"
                : "border-stone-200 bg-stone-50 text-stone-600 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-300",
            ].join(" ")}
          >
            <FilePenLine className="h-4 w-4" />
            Filtri
            {hasFilters && (
              <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[11px] font-bold text-[var(--brand-on-primary)]">
                {activeCount}
              </span>
            )}
          </Button>
        </div>

        <p className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400">
          {pageLabel}
        </p>
      </div>

      {filtriOpen && (
        <div className="mt-3 grid gap-3 border-t border-stone-100 pt-3 dark:border-stone-800 md:grid-cols-2 xl:grid-cols-[220px_1fr_1fr_1fr_auto] xl:items-end">
          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">Tipo</p>
            <Select value={filtri.tipo} onValueChange={(value) => onChange({ tipo: value })}>
              <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none focus:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                {TIPO_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value} className="rounded-lg">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canFilterBoutique && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">Boutique</p>
              <Select value={filtri.boutiqueId} onValueChange={(value) => onChange({ boutiqueId: value })}>
                <SelectTrigger className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none focus:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
                  <SelectItem value={ALL_VALUE} className="rounded-lg">Tutte le boutique</SelectItem>
                  {boutiques.map((boutique) => (
                    <SelectItem key={boutique.id} value={String(boutique.id)} className="rounded-lg">
                      {boutique.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">Dal</p>
            <Input
              type="date"
              value={filtri.dal}
              onChange={(event) => onChange({ dal: event.target.value })}
              className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
            />
          </div>

          <div className="space-y-1.5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">Al</p>
            <Input
              type="date"
              value={filtri.al}
              onChange={(event) => onChange({ al: event.target.value })}
              className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={onReset}
            disabled={!hasFilters}
            className="h-10 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
          >
            <X className="h-4 w-4" />
            Reset
          </Button>
        </div>
      )}
    </section>
  );
}
