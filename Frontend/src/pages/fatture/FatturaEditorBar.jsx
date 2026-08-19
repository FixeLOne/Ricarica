import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatMoney } from "@/lib/format";

/**
 * Intestazione dell'editor: numero documento, stato del salvataggio, totali e
 * azioni.
 *
 * Ha due rese perche' ha due posti in cui vivere. Da 1400px in su sta nella
 * barra alta dell'app, che era vuota per oltre mille pixel, e libera ~230px di
 * altezza alla colonna di compilazione. Sotto, dove la barra e' gia' stretta,
 * resta un blocco di pagina impilato e le azioni tornano in fondo alla colonna.
 */
export function EditorBar({ layout, titolo, autosaveLabel, totals, isAvoir, onBack, azioni }) {
  const inBarra = layout === "barra";

  const indietro = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={onBack}
      className={`shrink-0 rounded-xl border-stone-200 text-stone-600 dark:border-stone-800 dark:text-stone-300 ${inBarra ? "h-8 w-8" : "mt-0.5 h-9 w-9"}`}
      aria-label="Torna alle fatture"
    >
      <ArrowLeft className="h-4 w-4" />
    </Button>
  );

  const stato = autosaveLabel && (
    <span className={`inline-flex min-w-[7.5rem] items-center gap-1 text-xs font-medium ${autosaveLabel.tone}`}>
      <autosaveLabel.icon className={`h-3.5 w-3.5 ${autosaveLabel.spin ? "animate-spin" : ""}`} />
      {autosaveLabel.text}
    </span>
  );

  if (inBarra) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {indietro}
        <h1 className="truncate text-base font-semibold tracking-tight text-stone-950 dark:text-stone-50">
          {titolo}
        </h1>
        {stato}

        <div className="ml-auto flex items-center gap-3">
          <TotaliInline totals={totals} isAvoir={isAvoir} />
          <div className="flex items-center gap-2">{azioni}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 border-b border-stone-200 pb-4 dark:border-stone-800 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        {indietro}
        <h1 className="truncate text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
          {titolo}
        </h1>
        {stato}
      </div>
      <TotaliCard totals={totals} isAvoir={isAvoir} />
    </div>
  );
}

/** Etichetta del totale finale: un avoir non si paga, si accredita. */
function etichettaNetto(isAvoir) {
  return isAvoir ? "Net à créditer" : "Net à payer";
}

/**
 * Totali in riga per la barra alta, che e' alta 56px e non regge tre schede.
 * Sotto i 1536px restano solo l'imponibile e il netto: la TVA e' ricavabile e
 * il netto e' l'unico numero che si guarda davvero mentre si compila.
 */
function TotaliInline({ totals, isAvoir }) {
  return (
    <div className="flex items-center gap-4">
      <Voce etichetta="HT net" valore={totals.totaleHTNet} className="hidden 2xl:flex" />
      <Voce etichetta="TVA" valore={totals.totaleTVA} className="hidden 2xl:flex" />
      <div className="flex items-baseline gap-1.5 rounded-lg border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-text)]">
          {etichettaNetto(isAvoir)}
        </span>
        <span className="text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-50">
          {formatMoney(totals.totaleNet)}
        </span>
      </div>
    </div>
  );
}

function Voce({ etichetta, valore, className = "" }) {
  return (
    <div className={`items-baseline gap-1.5 ${className}`}>
      <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-stone-400">
        {etichetta}
      </span>
      <span className="text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-50">
        {formatMoney(valore)}
      </span>
    </div>
  );
}

function TotaliCard({ totals, isAvoir }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
      <Scheda etichetta="HT net" valore={totals.totaleHTNet} />
      <Scheda etichetta="TVA" valore={totals.totaleTVA} />
      <div className="rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--brand-text)]">
          {etichettaNetto(isAvoir)}
        </p>
        <p className="text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-50">
          {formatMoney(totals.totaleNet)}
        </p>
      </div>
    </div>
  );
}

function Scheda({ etichetta, valore }) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white px-3 py-2 dark:border-stone-800 dark:bg-stone-900">
      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400">{etichetta}</p>
      <p className="text-sm font-semibold tabular-nums text-stone-950 dark:text-stone-50">
        {formatMoney(valore)}
      </p>
    </div>
  );
}
