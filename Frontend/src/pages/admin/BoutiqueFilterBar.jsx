import { useEffect, useRef, useState } from "react";
import {
  MapPin,
  RotateCcw,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FILTRI_SERVIZIO, FILTRI_STATO } from "./boutiqueHelpers";

function SegmentedFilter({ label, options, value, onChange }) {
  return (
      <div className="grid gap-2 sm:grid-cols-[78px_1fr] sm:items-center">
        <p className="text-xs font-semibold text-stone-700 dark:text-stone-200">{label}</p>
        <div className="grid grid-cols-3 gap-1 rounded-full border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-stone-950/30">
          {options.map((item) => (
              <button
                  key={item.id}
                  type="button"
                  onClick={() => onChange(item.id)}
                  className={[
                    "h-8 rounded-full px-2 text-xs font-semibold transition-colors",
                    value === item.id
                        ? "bg-white text-[var(--brand-text)] shadow-sm ring-1 ring-[var(--brand-border)] dark:bg-stone-900"
                        : "text-stone-500 hover:bg-white hover:text-[var(--brand-text)] dark:text-stone-400 dark:hover:bg-stone-900",
                  ].join(" ")}
              >
                {item.label}
              </button>
          ))}
        </div>
      </div>
  );
}

function FilterChip({ label, onRemove }) {
  return (
      <button
          type="button"
          onClick={onRemove}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 text-xs font-semibold text-[var(--brand-text)] transition-colors hover:bg-[var(--brand-soft-strong)]"
      >
        {label}
        <X className="h-3 w-3" />
      </button>
  );
}

export default function BoutiqueFilterBar({
  filtri,
  onChange,
  onReset,
  chips,
  cittaOptions,
  countLabel,
}) {
  const [filtriOpen, setFiltriOpen] = useState(false);
  const filtriRef = useRef(null);

  useEffect(() => {
    if (!filtriOpen) return undefined;

    const closeOnOutsideClick = (event) => {
      if (!filtriRef.current?.contains(event.target)) {
        setFiltriOpen(false);
      }
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setFiltriOpen(false);
    };

    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtriOpen]);

  return (
      <div className="space-y-3 rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                  value={filtri.query}
                  onChange={(event) => onChange({ query: event.target.value })}
                  placeholder="Cerca boutique o citta"
                  className="h-10 rounded-xl border-stone-200 bg-stone-50 pl-9 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>

            <div ref={filtriRef} className="relative w-full sm:w-auto">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => setFiltriOpen((open) => !open)}
                  aria-expanded={filtriOpen}
                  className={[
                    "h-10 w-full rounded-xl px-3 text-sm font-semibold shadow-none sm:w-auto",
                    chips.length > 0
                        ? "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]"
                        : "border-stone-200 bg-stone-50 text-stone-600 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-300",
                  ].join(" ")}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtri
                {chips.length > 0 && (
                    <span className="ml-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--brand-primary)] px-1.5 text-[11px] font-bold text-white">
                  {chips.length}
                </span>
                )}
              </Button>

              {filtriOpen && (
                  <div className="absolute left-0 top-12 z-40 max-h-[70vh] w-full overflow-y-auto rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_24px_70px_-44px_rgba(120,84,32,0.45)] dark:border-stone-800 dark:bg-stone-900 sm:w-[390px]">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">
                        Filtri boutique
                      </p>
                      {chips.length > 0 && (
                          <button
                              type="button"
                              onClick={onReset}
                              className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
                          >
                            <RotateCcw className="h-3 w-3" />
                            Reset
                          </button>
                      )}
                    </div>

                    <div className="space-y-3">
                      <SegmentedFilter
                          label="Stato"
                          options={FILTRI_STATO}
                          value={filtri.stato}
                          onChange={(value) => onChange({ stato: value })}
                      />
                      <SegmentedFilter
                          label="Ricariche"
                          options={FILTRI_SERVIZIO}
                          value={filtri.ricariche}
                          onChange={(value) => onChange({ ricariche: value })}
                      />
                      <SegmentedFilter
                          label="Fatture"
                          options={FILTRI_SERVIZIO}
                          value={filtri.fatture}
                          onChange={(value) => onChange({ fatture: value })}
                      />

                      {cittaOptions.length > 0 && (
                          <div className="grid gap-2 pt-1 sm:grid-cols-[78px_1fr] sm:items-start">
                            <p className="pt-1.5 text-xs font-semibold text-stone-700 dark:text-stone-200">Citta</p>
                            <div className="flex flex-wrap gap-1.5">
                              <button
                                  type="button"
                                  onClick={() => onChange({ citta: "tutte" })}
                                  className={[
                                    "inline-flex h-8 items-center rounded-full px-3 text-xs font-semibold transition-colors",
                                    filtri.citta === "tutte"
                                        ? "border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] shadow-sm"
                                        : "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-300",
                                  ].join(" ")}
                              >
                                Tutte
                              </button>
                              {cittaOptions.map((citta) => (
                                  <button
                                      key={citta}
                                      type="button"
                                      onClick={() => onChange({ citta })}
                                      className={[
                                        "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors",
                                        filtri.citta === citta
                                            ? "border border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] shadow-sm"
                                            : "border border-stone-200 bg-stone-50 text-stone-600 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:bg-stone-950/30 dark:text-stone-300",
                                      ].join(" ")}
                                  >
                                    <MapPin className="h-3 w-3" />
                                    {citta}
                                  </button>
                              ))}
                            </div>
                          </div>
                      )}
                    </div>
                  </div>
              )}
            </div>
          </div>

          <p className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400 xl:pt-2.5">
            {countLabel}
          </p>
        </div>

        {chips.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {chips.map((item) => (
                  <FilterChip key={item.id} label={item.label} onRemove={item.onRemove} />
              ))}
              <button
                  type="button"
                  onClick={onReset}
                  className="h-8 rounded-full px-2 text-xs font-semibold text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-200"
              >
                Reset
              </button>
            </div>
        )}
      </div>
  );
}
