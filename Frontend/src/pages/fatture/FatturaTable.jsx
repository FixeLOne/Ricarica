import {
  Eye,
  Pencil,
  ReceiptText,
  RotateCcw,
  Send,
  Trash2,
  Undo2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusPill, TypePill } from "./FatturaPills";

function InvoiceActions({ fattura, working, onPreview, onEdit, onAskAction }) {
  const isBozza = fattura.stato === "BOZZA";
  const canAvoir = fattura.stato === "EMESSA" && fattura.tipo !== "AVOIR";

  return (
    <div className="flex items-center justify-end gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onPreview(fattura)}
        className="h-8 w-8 rounded-xl text-stone-500 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)]"
        aria-label={`Visualizza ${fattura.numero}`}
      >
        <Eye className="h-4 w-4" />
      </Button>

      {isBozza && (
        <>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onEdit(fattura)}
            className="h-8 w-8 rounded-xl text-stone-500 hover:bg-stone-100 hover:text-stone-800 dark:hover:bg-stone-800 dark:hover:text-stone-100"
            aria-label={`Modifica ${fattura.numero}`}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={working}
            onClick={() => onAskAction("emit", fattura)}
            className="h-8 w-8 rounded-xl text-stone-500 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)]"
            aria-label={`Emetti ${fattura.numero}`}
          >
            <Send className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            disabled={working}
            onClick={() => onAskAction("delete", fattura)}
            className="h-8 w-8 rounded-xl text-stone-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-300"
            aria-label={`Elimina ${fattura.numero}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </>
      )}

      {canAvoir && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          disabled={working}
          onClick={() => onAskAction("avoir", fattura)}
          className="h-8 w-8 rounded-xl text-stone-500 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)]"
          aria-label={`Crea avoir per ${fattura.numero}`}
        >
          <Undo2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

export function FatturaTable({ fatture, workingId, onPreview, onEdit, onAskAction }) {
  return (
    <div className="hidden overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_18px_50px_-44px_rgba(15,23,42,0.55)] dark:border-stone-800 dark:bg-stone-900 lg:block">
      <table className="w-full">
        <thead className="border-b border-stone-100 bg-stone-50/80 dark:border-stone-800 dark:bg-stone-950/35">
          <tr className="text-left text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400 dark:text-stone-500">
            <th className="px-5 py-3">Documento</th>
            <th className="px-4 py-3">Cliente</th>
            <th className="px-4 py-3">Stato</th>
            <th className="px-4 py-3">Boutique</th>
            <th className="px-4 py-3 text-right">Totale</th>
            <th className="px-5 py-3 text-right">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {fatture.map((fattura) => (
            <tr key={fattura.id} className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/70 dark:border-stone-800 dark:hover:bg-stone-950/35">
              <td className="px-5 py-4">
                <div className="flex min-w-0 flex-col gap-1.5">
                  <div className="flex items-center gap-2">
                    <TypePill tipo={fattura.tipo} />
                    <span className="text-xs text-stone-400 dark:text-stone-500">{formatDate(fattura.dataEmissione)}</span>
                  </div>
                  <p className="font-semibold tabular-nums text-stone-950 dark:text-stone-50">{fattura.numero}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="max-w-[220px] truncate text-sm font-medium text-stone-800 dark:text-stone-200">
                  {fattura.nomeCliente || "Cliente non indicato"}
                </p>
                {fattura.fatturaOrigineNumero && (
                  <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">Origine {fattura.fatturaOrigineNumero}</p>
                )}
              </td>
              <td className="px-4 py-4">
                <StatusPill stato={fattura.stato} />
              </td>
              <td className="px-4 py-4">
                <p className="max-w-[160px] truncate text-sm text-stone-600 dark:text-stone-300">
                  {fattura.nomeBoutique || "Admin"}
                </p>
              </td>
              <td className="px-4 py-4 text-right">
                <p className="font-semibold tabular-nums text-stone-950 dark:text-stone-50">{formatMoney(fattura.totaleNet)}</p>
                <p className="mt-1 text-xs tabular-nums text-stone-400 dark:text-stone-500">TVA {formatMoney(fattura.totaleTVA)}</p>
              </td>
              <td className="px-5 py-4">
                <InvoiceActions
                  fattura={fattura}
                  working={workingId === fattura.id}
                  onPreview={onPreview}
                  onEdit={onEdit}
                  onAskAction={onAskAction}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FatturaCards({ fatture, workingId, onPreview, onEdit, onAskAction }) {
  return (
    <div className="grid gap-3 lg:hidden">
      {fatture.map((fattura) => (
        <article key={fattura.id} className="rounded-2xl border border-stone-200 bg-white p-4 shadow-[0_18px_50px_-44px_rgba(15,23,42,0.55)] dark:border-stone-800 dark:bg-stone-900">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <TypePill tipo={fattura.tipo} />
                <StatusPill stato={fattura.stato} />
              </div>
              <p className="mt-3 font-semibold tabular-nums text-stone-950 dark:text-stone-50">{fattura.numero}</p>
              <p className="mt-1 truncate text-sm text-stone-500 dark:text-stone-400">{fattura.nomeCliente || "Cliente non indicato"}</p>
            </div>
            <p className="shrink-0 text-right font-semibold tabular-nums text-stone-950 dark:text-stone-50">{formatMoney(fattura.totaleNet)}</p>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 border-t border-stone-100 pt-3 dark:border-stone-800">
            <div className="min-w-0 text-xs text-stone-500 dark:text-stone-400">
              <p>{formatDate(fattura.dataEmissione)}</p>
              <p className="truncate">{fattura.nomeBoutique || "Admin"}</p>
            </div>
            <InvoiceActions
              fattura={fattura}
              working={workingId === fattura.id}
              onPreview={onPreview}
              onEdit={onEdit}
              onAskAction={onAskAction}
            />
          </div>
        </article>
      ))}
    </div>
  );
}

export function LoadingTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-stone-200 bg-white dark:border-stone-800 dark:bg-stone-900">
      {Array.from({ length: 7 }).map((_, index) => (
        <div key={index} className="grid grid-cols-[1fr_1fr_1fr_120px] gap-4 border-b border-stone-100 px-5 py-4 last:border-b-0 dark:border-stone-800">
          <div className="h-4 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
          <div className="h-4 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
          <div className="h-4 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
          <div className="h-4 animate-pulse rounded-full bg-stone-100 dark:bg-stone-800" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ hasFilters, onReset }) {
  return (
    <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--brand-border)] bg-[var(--brand-soft)] px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-[var(--brand-text)] shadow-sm dark:bg-stone-900/60">
        <ReceiptText className="h-5 w-5" />
      </span>
      <h2 className="mt-4 text-base font-semibold text-stone-950 dark:text-stone-50">
        {hasFilters ? "Nessuna fattura trovata" : "Nessuna fattura"}
      </h2>
      <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-stone-400">
        {hasFilters ? "Prova a cambiare ricerca, stato, tipo o periodo." : "Le bozze e i documenti emessi compariranno qui."}
      </p>
      {hasFilters && (
        <Button onClick={onReset} className="brand-primary mt-5 h-9 rounded-xl font-semibold">
          <RotateCcw className="h-4 w-4" />
          Reset filtri
        </Button>
      )}
    </div>
  );
}
