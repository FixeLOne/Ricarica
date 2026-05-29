import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CircleSlash2,
  Clock3,
  Eye,
  FilePenLine,
  FileText,
  Pencil,
  Printer,
  ReceiptText,
  RefreshCw,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Undo2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getBoutique, getTutteLeBoutique } from "@/api/boutiqueApi";
import { getDatiAzienda } from "@/api/aziendaApi";
import {
  creaAvoir,
  eliminaFattura,
  emettiFattura,
  getFatture,
} from "@/api/fattureApi";
import { useAuth } from "@/context/AuthContext";

const PAGE_SIZE = 12;
const ALL_VALUE = "__ALL__";

const STATO_OPTIONS = [
  { value: ALL_VALUE, label: "Tutte", icon: FileText },
  { value: "BOZZA", label: "Bozze", icon: Clock3 },
  { value: "EMESSA", label: "Emesse", icon: CheckCircle2 },
  { value: "ANNULLATA", label: "Annullate", icon: CircleSlash2 },
];

const TIPO_OPTIONS = [
  { value: ALL_VALUE, label: "Tutti i tipi" },
  { value: "FACTURE", label: "Fatture" },
  { value: "DEVIS", label: "Devis" },
  { value: "BON_DE_LIVRAISON", label: "BL" },
  { value: "AVOIR", label: "Avoir" },
];

const STATO_STYLE = {
  BOZZA: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
  EMESSA: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
  ANNULLATA: "border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

function getApiError(error) {
  return (
    error?.response?.data?.errore ||
    error?.response?.data?.message ||
    (typeof error?.response?.data === "string" ? error.response.data : null) ||
    "Operazione non riuscita"
  );
}

function compactParams(params) {
  return Object.entries(params).reduce((result, [key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== ALL_VALUE) {
      result[key] = value;
    }
    return result;
  }, {});
}

function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function formatMoney(value) {
  const amount = Number(value ?? 0);
  return `${amount.toLocaleString("it-IT", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} DT`;
}

function formatPercent(value) {
  return `${Number(value ?? 0).toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

function getTipoLabel(tipo) {
  return TIPO_OPTIONS.find((item) => item.value === tipo)?.label ?? tipo ?? "-";
}

function getStatoLabel(stato) {
  return STATO_OPTIONS.find((item) => item.value === stato)?.label?.replace(/e$/, "a") ?? stato ?? "-";
}

function getLogoSrc(logo) {
  if (!logo) return null;
  return logo.startsWith("data:") ? logo : `data:image/png;base64,${logo}`;
}

function normalizeBoutique(boutique) {
  return {
    id: boutique.id,
    nome: boutique.nome,
    citta: boutique.citta ?? boutique["città"] ?? boutique["cittÃ "] ?? "",
  };
}

function StatusPill({ stato }) {
  const Icon = STATO_OPTIONS.find((item) => item.value === stato)?.icon ?? FileText;

  return (
    <span className={`inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold ${STATO_STYLE[stato] ?? STATO_STYLE.BOZZA}`}>
      <Icon className="h-3.5 w-3.5" />
      {getStatoLabel(stato)}
    </span>
  );
}

function TypePill({ tipo }) {
  return (
    <span className="inline-flex h-7 items-center rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 text-xs font-semibold text-[var(--brand-text)]">
      {getTipoLabel(tipo)}
    </span>
  );
}

function SummaryTile({ label, value, hint, highlighted = false, icon: Icon }) {
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

function LoadingTable() {
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

function EmptyState({ hasFilters, onReset }) {
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

function FatturaTable({ fatture, workingId, onPreview, onEdit, onAskAction }) {
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

function FatturaCards({ fatture, workingId, onPreview, onEdit, onAskAction }) {
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

function InvoicePreviewDialog({ fattura, azienda, open, onOpenChange, onAskAction, working }) {
  const logoSrc = getLogoSrc(azienda?.logo);
  const isBozza = fattura?.stato === "BOZZA";
  const canAvoir = fattura?.stato === "EMESSA" && fattura?.tipo !== "AVOIR";

  if (!fattura) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] w-[calc(100vw-2rem)] max-w-5xl overflow-y-auto rounded-2xl border-stone-200 bg-stone-50 p-0 dark:border-stone-800 dark:bg-stone-950">
        <div className="no-print flex flex-col gap-3 border-b border-stone-200 bg-white py-4 pl-5 pr-14 dark:border-stone-800 dark:bg-stone-900 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <DialogTitle className="text-base font-semibold text-stone-950 dark:text-stone-50">
              {fattura.numero}
            </DialogTitle>
            <DialogDescription className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Anteprima documento. Usa Stampa/PDF per salvarlo dal browser.
            </DialogDescription>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isBozza && (
              <Button
                type="button"
                disabled={working}
                onClick={() => onAskAction("emit", fattura)}
                className="brand-primary h-9 rounded-xl font-semibold"
              >
                <Send className="h-4 w-4" />
                Emetti
              </Button>
            )}
            {canAvoir && (
              <Button
                type="button"
                variant="outline"
                disabled={working}
                onClick={() => onAskAction("avoir", fattura)}
                className="h-9 rounded-xl border-[var(--brand-border)] bg-[var(--brand-soft)] text-[var(--brand-text)] hover:bg-[var(--brand-soft-strong)]"
              >
                <Undo2 className="h-4 w-4" />
                Avoir
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => window.print()}
              className="h-9 rounded-xl border-stone-200 bg-white text-stone-700 hover:bg-stone-50 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              <Printer className="h-4 w-4" />
              Stampa/PDF
            </Button>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="invoice-print-area mx-auto min-h-[980px] max-w-[794px] rounded-2xl border border-stone-200 bg-white p-8 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] dark:border-stone-800 dark:bg-white dark:text-stone-950 sm:p-10">
            <div className="flex items-start justify-between gap-8 border-b border-stone-200 pb-8">
              <div className="min-w-0">
                {logoSrc ? (
                  <img src={logoSrc} alt="Logo azienda" className="mb-5 h-14 max-w-44 object-contain object-left" />
                ) : (
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
                    <ReceiptText className="h-6 w-6" />
                  </div>
                )}
                <h2 className="text-lg font-semibold text-stone-950">{azienda?.ragioneSociale || "Dati azienda non configurati"}</h2>
                <p className="mt-1 max-w-sm text-sm text-stone-500">{azienda?.indirizzo || "Indirizzo non disponibile"}</p>
                {azienda?.matriculeFiscale && (
                  <p className="mt-1 text-sm text-stone-500">MF {azienda.matriculeFiscale}</p>
                )}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">{getTipoLabel(fattura.tipo)}</p>
                <p className="mt-2 text-xl font-semibold tabular-nums text-stone-950">{fattura.numero}</p>
                <p className="mt-1 text-sm text-stone-500">{formatDate(fattura.dataEmissione)}</p>
                <div className="mt-4 flex justify-end">
                  <StatusPill stato={fattura.stato} />
                </div>
              </div>
            </div>

            <div className="grid gap-5 border-b border-stone-200 py-7 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Cliente</p>
                <p className="mt-2 text-base font-semibold text-stone-950">{fattura.nomeCliente || "Cliente non indicato"}</p>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Origine</p>
                <p className="mt-2 text-base font-semibold text-stone-950">
                  {fattura.fatturaOrigineNumero || fattura.nomeBoutique || "Admin"}
                </p>
              </div>
            </div>

            <div className="py-7">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-stone-200 text-left text-[11px] font-semibold uppercase tracking-[0.16em] text-stone-400">
                    <th className="py-3">Ref</th>
                    <th className="py-3">Descrizione</th>
                    <th className="py-3 text-right">Qta</th>
                    <th className="py-3 text-right">Prezzo HT</th>
                    <th className="py-3 text-right">Remise</th>
                    <th className="py-3 text-right">TVA</th>
                    <th className="py-3 text-right">Totale HT</th>
                  </tr>
                </thead>
                <tbody>
                  {(fattura.righe ?? []).map((riga) => (
                    <tr key={riga.id ?? riga.descrizione} className="border-b border-stone-100 text-sm">
                      <td className="py-4 pr-4 tabular-nums text-stone-500">{riga.reference || "-"}</td>
                      <td className="py-4 pr-4 text-stone-800">{riga.descrizione}</td>
                      <td className="py-4 text-right tabular-nums text-stone-600">{Number(riga.quantita ?? 0).toLocaleString("it-IT")}</td>
                      <td className="py-4 text-right tabular-nums text-stone-600">{formatMoney(riga.prezzoUnitarioHT)}</td>
                      <td className="py-4 text-right tabular-nums text-stone-600">{formatPercent(riga.scontoPercentuale)}</td>
                      <td className="py-4 text-right tabular-nums text-stone-600">{formatPercent(riga.aliquotaTVA)}</td>
                      <td className="py-4 text-right tabular-nums font-medium text-stone-950">{formatMoney(riga.montanteHT)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="ml-auto w-full max-w-sm space-y-3 border-t border-stone-200 pt-5">
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Totale HT</span>
                <span className="font-medium tabular-nums text-stone-950">{formatMoney(fattura.totaleHT)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Totale TVA</span>
                <span className="font-medium tabular-nums text-stone-950">{formatMoney(fattura.totaleTVA)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-stone-500">Remise</span>
                <span className="font-medium tabular-nums text-stone-950">{formatMoney(fattura.remiseGlobale)}</span>
              </div>
              {fattura.timbreFiscal && (
                <div className="flex justify-between gap-4 text-sm">
                  <span className="text-stone-500">Timbre fiscal</span>
                  <span className="font-medium tabular-nums text-stone-950">{formatMoney(fattura.timbreFiscalMontant)}</span>
                </div>
              )}
              <div className="flex justify-between gap-4 rounded-2xl bg-[var(--brand-soft)] px-4 py-3">
                <span className="font-semibold text-[var(--brand-text)]">Net a payer</span>
                <span className="font-semibold tabular-nums text-stone-950">{formatMoney(fattura.totaleNet)}</span>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmActionDialog({ action, open, onOpenChange, onConfirm, working }) {
  const fattura = action?.fattura;
  const copy = {
    emit: {
      title: "Emettere la bozza?",
      description: "Il documento ricevera un numero definitivo e non sara piu modificabile.",
      confirm: "Emetti",
      icon: Send,
    },
    avoir: {
      title: "Creare un Avoir?",
      description: "La fattura originale verra annullata e verra emesso un documento Avoir collegato.",
      confirm: "Crea Avoir",
      icon: Undo2,
    },
    delete: {
      title: "Eliminare la bozza?",
      description: "Solo le bozze possono essere eliminate. Questa operazione rimuove il documento non emesso.",
      confirm: "Elimina",
      icon: Trash2,
    },
  }[action?.type] ?? {};
  const Icon = copy.icon ?? AlertCircle;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] max-w-md rounded-2xl border-stone-200 bg-white p-5 dark:border-stone-800 dark:bg-stone-900">
        <DialogHeader className="text-left">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
              <Icon className="h-5 w-5" />
            </span>
            <div>
              <DialogTitle className="text-base font-semibold text-stone-950 dark:text-stone-50">{copy.title}</DialogTitle>
              <DialogDescription className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                {copy.description}
              </DialogDescription>
              {fattura && (
                <p className="mt-3 rounded-xl border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold tabular-nums text-stone-800 dark:border-stone-800 dark:bg-stone-950/35 dark:text-stone-200">
                  {fattura.numero}
                </p>
              )}
            </div>
          </div>
        </DialogHeader>
        <DialogFooter className="mt-3 gap-2 sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            disabled={working}
            onClick={() => onOpenChange(false)}
            className="h-9 rounded-xl border-stone-200 text-stone-700 dark:border-stone-800 dark:text-stone-300"
          >
            Annulla
          </Button>
          <Button
            type="button"
            disabled={working}
            onClick={onConfirm}
            className={action?.type === "delete" ? "h-9 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700" : "brand-primary h-9 rounded-xl font-semibold"}
          >
            {working ? "Attendi..." : copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function FattureListPage() {
  const navigate = useNavigate();
  const { utente } = useAuth();
  const ruolo = utente?.ruolo;
  const canFilterBoutique = ruolo === "ADMIN" || ruolo === "SUPER_ADMIN";

  const [fatture, setFatture] = useState([]);
  const [pageInfo, setPageInfo] = useState({ number: 0, totalPages: 0, totalElements: 0 });
  const [boutiques, setBoutiques] = useState([]);
  const [azienda, setAzienda] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workingId, setWorkingId] = useState(null);
  const [apiError, setApiError] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [query, setQuery] = useState("");
  const [stato, setStato] = useState(ALL_VALUE);
  const [tipo, setTipo] = useState(ALL_VALUE);
  const [boutiqueId, setBoutiqueId] = useState(ALL_VALUE);
  const [dal, setDal] = useState("");
  const [al, setAl] = useState("");
  const [filtriOpen, setFiltriOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const filters = useMemo(() => compactParams({
    search: query.trim(),
    stato,
    tipo,
    boutiqueId,
    dal,
    al,
  }), [al, boutiqueId, dal, query, stato, tipo]);

  const hasFilters = Object.keys(filters).length > 0;

  const loadFatture = useCallback(async (targetPage = 0) => {
    setLoading(true);
    setApiError(null);
    try {
      const response = await getFatture(targetPage, PAGE_SIZE, filters);
      const data = response.data ?? {};
      setFatture(data.content ?? []);
      setPageInfo({
        number: data.number ?? targetPage,
        totalPages: data.totalPages ?? 0,
        totalElements: data.totalElements ?? 0,
      });
    } catch (error) {
      setApiError(getApiError(error));
      setFatture([]);
      setPageInfo({ number: 0, totalPages: 0, totalElements: 0 });
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadFatture(0);
    }, 180);

    return () => window.clearTimeout(timeoutId);
  }, [loadFatture]);

  useEffect(() => {
    let ignore = false;

    if (!canFilterBoutique) return undefined;

    const loadBoutiques = async () => {
      try {
        const response = ruolo === "SUPER_ADMIN" ? await getTutteLeBoutique() : await getBoutique();
        if (!ignore) {
          setBoutiques((response.data ?? []).map(normalizeBoutique));
        }
      } catch {
        if (!ignore) setBoutiques([]);
      }
    };

    void loadBoutiques();
    return () => {
      ignore = true;
    };
  }, [canFilterBoutique, ruolo]);

  useEffect(() => {
    let ignore = false;

    const loadAzienda = async () => {
      try {
        const response = await getDatiAzienda();
        if (!ignore) setAzienda(response.data ?? null);
      } catch {
        if (!ignore) setAzienda(null);
      }
    };

    void loadAzienda();
    return () => {
      ignore = true;
    };
  }, []);

  useEffect(() => {
    if (!feedback) return undefined;
    const timeoutId = window.setTimeout(() => setFeedback(null), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [feedback]);

  const summary = useMemo(() => {
    const bozze = fatture.filter((fattura) => fattura.stato === "BOZZA").length;
    const emesse = fatture.filter((fattura) => fattura.stato === "EMESSA").length;
    const totaleVista = fatture.reduce((totale, fattura) => totale + Number(fattura.totaleNet ?? 0), 0);

    return {
      totale: pageInfo.totalElements,
      bozze,
      emesse,
      totaleVista: formatMoney(totaleVista),
    };
  }, [fatture, pageInfo.totalElements]);

  const resetFilters = () => {
    setQuery("");
    setStato(ALL_VALUE);
    setTipo(ALL_VALUE);
    setBoutiqueId(ALL_VALUE);
    setDal("");
    setAl("");
  };

  const askAction = (type, fattura) => {
    setPendingAction({ type, fattura });
  };

  const closeAction = (open) => {
    if (!open && !workingId) setPendingAction(null);
  };

  const confirmAction = async () => {
    if (!pendingAction?.fattura) return;

    const { type, fattura } = pendingAction;
    setWorkingId(fattura.id);
    setApiError(null);
    try {
      if (type === "emit") {
        await emettiFattura(fattura.id);
        setFeedback("Documento emesso correttamente.");
      }
      if (type === "avoir") {
        await creaAvoir(fattura.id);
        setFeedback("Avoir creato e fattura originale annullata.");
      }
      if (type === "delete") {
        await eliminaFattura(fattura.id);
        setFeedback("Bozza eliminata.");
      }
      setPendingAction(null);
      setPreview(null);
      await loadFatture(pageInfo.number);
    } catch (error) {
      setApiError(getApiError(error));
    } finally {
      setWorkingId(null);
    }
  };

  const pageNumber = pageInfo.number ?? 0;
  const totalPages = pageInfo.totalPages ?? 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_0_4px_var(--brand-soft)]" />
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--brand-text)]">
              Documenti fiscali
            </p>
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">Fatture</h1>
            <p className="mt-1 max-w-2xl text-sm text-stone-500 dark:text-stone-400">
              Consulta bozze, documenti emessi e Avoir. La stampa usa l'anteprima documento.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => loadFatture(pageNumber)}
            className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Aggiorna
          </Button>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryTile label="Totale" value={summary.totale} hint="documenti nella ricerca" icon={ReceiptText} highlighted />
        <SummaryTile label="Bozze" value={summary.bozze} hint="modificabili prima emissione" icon={Clock3} />
        <SummaryTile label="Emesse" value={summary.emesse} hint="pronte per stampa o Avoir" icon={CheckCircle2} />
        <SummaryTile label="Valore vista" value={summary.totaleVista} hint="somma della pagina corrente" icon={FilePenLine} />
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex w-full min-w-0 flex-col gap-2 md:flex-row md:items-center">
            <div className="relative w-full md:max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Cerca numero, cliente o boutique"
                className="h-10 rounded-xl border-stone-200 bg-stone-50 pl-9 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>

            <div className="grid grid-cols-4 gap-1 rounded-xl border border-stone-200 bg-stone-50 p-1 dark:border-stone-800 dark:bg-stone-950/35 md:w-[380px]">
              {STATO_OPTIONS.map((option) => {
                const Icon = option.icon;
                const active = stato === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setStato(option.value)}
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
              onClick={() => setFiltriOpen((value) => !value)}
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
                  {Object.keys(filters).length}
                </span>
              )}
            </Button>
          </div>

          <p className="shrink-0 text-xs font-medium text-stone-500 dark:text-stone-400">
            Pagina {totalPages === 0 ? 0 : pageNumber + 1} di {totalPages}
          </p>
        </div>

        {filtriOpen && (
          <div className="mt-3 grid gap-3 border-t border-stone-100 pt-3 dark:border-stone-800 md:grid-cols-2 xl:grid-cols-[220px_1fr_1fr_1fr_auto] xl:items-end">
            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">Tipo</p>
              <Select value={tipo} onValueChange={setTipo}>
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
                <Select value={boutiqueId} onValueChange={setBoutiqueId}>
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
                value={dal}
                onChange={(event) => setDal(event.target.value)}
                className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-400 dark:text-stone-500">Al</p>
              <Input
                type="date"
                value={al}
                onChange={(event) => setAl(event.target.value)}
                className="h-10 rounded-xl border-stone-200 bg-stone-50 shadow-none focus-visible:border-[var(--brand-border)] focus-visible:ring-2 focus-visible:ring-[var(--brand-ring)] dark:border-stone-800 dark:bg-stone-950/40"
              />
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={resetFilters}
              disabled={!hasFilters}
              className="h-10 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
            >
              <X className="h-4 w-4" />
              Reset
            </Button>
          </div>
        )}
      </section>

      {feedback && (
        <div className="flex items-center gap-2 rounded-xl border border-[var(--brand-border)] bg-[var(--brand-soft)] px-3 py-2 text-sm font-medium text-[var(--brand-text)]">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {apiError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-800/70 dark:bg-red-500/10 dark:text-red-300">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{apiError}</span>
        </div>
      )}

      {loading ? (
        <LoadingTable />
      ) : fatture.length === 0 ? (
        <EmptyState hasFilters={hasFilters} onReset={resetFilters} />
      ) : (
        <>
          <FatturaTable
            fatture={fatture}
            workingId={workingId}
            onPreview={setPreview}
            onEdit={(fattura) => navigate(`/fatture/${fattura.id}`)}
            onAskAction={askAction}
          />
          <FatturaCards
            fatture={fatture}
            workingId={workingId}
            onPreview={setPreview}
            onEdit={(fattura) => navigate(`/fatture/${fattura.id}`)}
            onAskAction={askAction}
          />
        </>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={loading || pageNumber <= 0}
          onClick={() => loadFatture(pageNumber - 1)}
          className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Indietro
        </Button>
        <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
          {pageInfo.totalElements} documenti
        </p>
        <Button
          type="button"
          variant="outline"
          disabled={loading || totalPages === 0 || pageNumber >= totalPages - 1}
          onClick={() => loadFatture(pageNumber + 1)}
          className="h-9 rounded-xl border-stone-200 text-stone-600 hover:bg-stone-50 dark:border-stone-800 dark:text-stone-300 dark:hover:bg-stone-900"
        >
          Avanti
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      <InvoicePreviewDialog
        fattura={preview}
        azienda={azienda}
        open={Boolean(preview)}
        onOpenChange={(open) => !open && setPreview(null)}
        onAskAction={askAction}
        working={workingId === preview?.id}
      />

      <ConfirmActionDialog
        action={pendingAction}
        open={Boolean(pendingAction)}
        onOpenChange={closeAction}
        onConfirm={confirmAction}
        working={Boolean(workingId)}
      />
    </div>
  );
}
