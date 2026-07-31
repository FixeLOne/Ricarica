import {
  CirclePause,
  CirclePlay,
  KeyRound,
  MapPin,
  Pencil,
  Plus,
  Store,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { getServiceToggleKey, SERVIZI_BOUTIQUE } from "./boutiqueHelpers";

function ServizioRow({ boutique, item, onToggle, disabled }) {
  const checked = boutique[item.field];
  const Icon = item.icon;

  return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-stone-200 bg-stone-50/70 px-3 py-3 dark:border-stone-800 dark:bg-stone-950/35">
        <div className="flex min-w-0 items-center gap-2.5">
        <span
            className={[
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
              checked
                  ? "bg-[var(--brand-soft)] text-[var(--brand-text)]"
                  : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
            ].join(" ")}
        >
          <Icon className="h-4 w-4" />
        </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-stone-900 dark:text-stone-100">{item.label}</p>
            <p className="truncate text-xs text-stone-500 dark:text-stone-400">
              {checked ? item.onText : item.offText}
            </p>
          </div>
        </div>

        <Switch
            checked={checked}
            disabled={disabled}
            onCheckedChange={(value) => onToggle(boutique, item, value)}
            className="data-[state=checked]:bg-[var(--brand-primary)] data-[state=unchecked]:bg-stone-200 dark:data-[state=unchecked]:bg-stone-700"
            aria-label={`${item.label} ${boutique.nome}`}
        />
      </div>
  );
}

export function BoutiqueCard({
  boutique,
  canManageAccount,
  onEdit,
  onManageAccount,
  onToggleServizio,
  onRequestStato,
  togglingKey,
}) {
  const attiva = boutique.attiva;

  return (
      <article className={[
        "group overflow-hidden rounded-2xl border bg-white shadow-[0_18px_48px_-42px_rgba(15,23,42,0.7)] transition-colors dark:bg-stone-900",
        attiva
            ? "border-stone-200 hover:border-[var(--brand-border)] dark:border-stone-800"
            : "border-stone-200/80 opacity-90 dark:border-stone-800/80",
      ].join(" ")}>
        <div className={[
          "relative border-b px-5 py-4",
          attiva
              ? "border-stone-100 bg-gradient-to-br from-white via-white to-[var(--brand-soft)] dark:border-stone-800 dark:from-stone-900 dark:via-stone-900 dark:to-[var(--brand-soft)]"
              : "border-stone-100 bg-stone-50/90 dark:border-stone-800 dark:bg-stone-900/70",
        ].join(" ")}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
            <span className={[
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border bg-white shadow-sm dark:bg-stone-950/50",
              attiva
                  ? "border-[var(--brand-border)] text-[var(--brand-text)]"
                  : "border-stone-200 text-stone-400 dark:border-stone-700 dark:text-stone-500",
            ].join(" ")}>
              {attiva ? <Store className="h-5 w-5" /> : <CirclePause className="h-5 w-5" />}
            </span>
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <h2 className="truncate text-base font-semibold tracking-tight text-stone-950 dark:text-stone-50">
                    {boutique.nome}
                  </h2>
                  <span className={[
                    "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    attiva
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                        : "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
                  ].join(" ")}>
                  {attiva ? "Attiva" : "Disattivata"}
                </span>
                </div>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{boutique.citta || "Città non indicata"}</span>
                </p>
              </div>
            </div>

            <button
                type="button"
                onClick={() => onEdit(boutique)}
                className="rounded-xl p-2 text-stone-400 transition-colors hover:bg-white/80 hover:text-[var(--brand-text)] dark:hover:bg-stone-800"
                aria-label={`Modifica ${boutique.nome}`}
            >
              <Pencil className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-5 py-4">
          {!attiva && (
              <div className="rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-600 dark:border-stone-800 dark:bg-stone-950/35 dark:text-stone-400">
                Non disponibile per nuove operazioni.
              </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3 px-0.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">
                Servizi
              </p>
              <p className="text-[11px] font-medium text-stone-400 dark:text-stone-500">
                {SERVIZI_BOUTIQUE.filter((item) => boutique[item.field]).length}/{SERVIZI_BOUTIQUE.length} attivi
              </p>
            </div>
            {SERVIZI_BOUTIQUE.map((item) => (
                <ServizioRow
                    key={item.servizio}
                    boutique={boutique}
                    item={item}
                    onToggle={onToggleServizio}
                    disabled={togglingKey === getServiceToggleKey(boutique.id, item.servizio)}
                />
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-stone-200/80 bg-white px-3 py-3 dark:border-stone-800 dark:bg-stone-950/25">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">ID</p>
              <p className="mt-1 text-sm font-semibold tabular-nums text-stone-800 dark:text-stone-200">#{boutique.id}</p>
            </div>
            <div className={[
              "rounded-xl border px-3 py-3",
              attiva
                  ? "border-[var(--brand-border)] bg-[var(--brand-soft)]"
                  : "border-stone-200 bg-stone-50 dark:border-stone-800 dark:bg-stone-950/25",
            ].join(" ")}>
              <p className={[
                "text-[10px] font-semibold uppercase tracking-[0.16em]",
                attiva ? "text-[var(--brand-text)]" : "text-stone-400 dark:text-stone-500",
              ].join(" ")}>
                Stato
              </p>
              <p className="mt-1 text-sm font-semibold text-stone-800 dark:text-stone-100">
                {attiva ? "Operativa" : "Sospesa"}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-100 pt-3 dark:border-stone-800">
            {canManageAccount ? (
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onManageAccount(boutique)}
                  className="h-8 rounded-xl border-stone-200 px-3 text-xs font-semibold text-stone-600 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
              >
                <KeyRound className="h-3.5 w-3.5" />
                Account
              </Button>
            ) : (
              <span />
            )}
            <Button
                type="button"
                variant="outline"
                onClick={() => onRequestStato(boutique)}
                className={[
                  "h-8 rounded-xl px-3 text-xs font-semibold",
                  attiva
                      ? "border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-800"
                      : "border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]",
                ].join(" ")}
            >
              {attiva ? <CirclePause className="h-3.5 w-3.5" /> : <CirclePlay className="h-3.5 w-3.5" />}
              {attiva ? "Disattiva" : "Riattiva"}
            </Button>
          </div>
        </div>
      </article>
  );
}

export function LoadingGrid() {
  return (
      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
            <div
                key={index}
                className="h-52 animate-pulse rounded-2xl border border-stone-200 bg-white/75 dark:border-stone-800 dark:bg-stone-900/70"
            >
              <div className="h-full rounded-2xl bg-gradient-to-br from-stone-100 via-transparent to-[var(--brand-soft)] dark:from-stone-800/70 dark:to-[var(--brand-soft)]" />
            </div>
        ))}
      </div>
  );
}

export function EmptyState({ canCreate, onCreate }) {
  return (
      <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-soft)] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--brand-text)] shadow-sm dark:bg-stone-900/60">
        <Store className="h-5 w-5" />
      </span>
        <h2 className="mt-4 text-base font-semibold text-stone-950 dark:text-stone-50">Nessuna boutique</h2>
        <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">
          Crea il primo punto vendita e il relativo account dipendente in un unico passaggio.
        </p>
        {canCreate && (
            <Button onClick={onCreate} className="brand-primary mt-5 h-9 rounded-xl font-semibold">
              <Plus className="h-4 w-4" />
              Nuova boutique
            </Button>
        )}
      </div>
  );
}
