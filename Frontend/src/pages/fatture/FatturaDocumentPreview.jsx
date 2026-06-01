import { ReceiptText } from "lucide-react";

import {
  calcolaRiga,
  calcolaTotaliDocumento,
  formatDate,
  formatMoney,
  formatPercent,
  getLogoSrc,
  getTipoLabel,
  TIMBRE_FISCAL_DEFAULT,
} from "./fatturaHelpers";

const FIRST_PAGE_ROWS = 6;
const CONTINUATION_PAGE_ROWS = 10;

function getRows(documento) {
  return (documento?.righe ?? []).map((riga, index) => ({
    ...riga,
    id: riga.id ?? riga.localId ?? index,
    ...calcolaRiga(riga),
  }));
}

function paginateRows(rows) {
  if (rows.length === 0) return [[]];

  const pages = [];
  let cursor = 0;
  let pageSize = FIRST_PAGE_ROWS;

  while (cursor < rows.length) {
    pages.push(rows.slice(cursor, cursor + pageSize));
    cursor += pageSize;
    pageSize = CONTINUATION_PAGE_ROWS;
  }

  return pages;
}

function getTotals(documento, timbreFiscalValue) {
  const computedTotals = calcolaTotaliDocumento(documento ?? {}, timbreFiscalValue);
  const totals = {
    ...computedTotals,
    remiseGlobale: documento?.remiseGlobale ?? computedTotals.remiseGlobale,
    totaleHT: documento?.totaleHT ?? computedTotals.totaleHT,
    totaleTVA: documento?.totaleTVA ?? computedTotals.totaleTVA,
    totaleNet: documento?.totaleNet ?? computedTotals.totaleNet,
    timbreFiscalMontant: documento?.timbreFiscalMontant ?? computedTotals.timbreFiscalMontant,
  };

  return {
    ...totals,
    totaleHTNet: documento?.totaleHTNet ?? Math.max(Number(totals.totaleHT ?? 0) - Number(totals.remiseGlobale ?? 0), 0),
  };
}

function PageFrame({ children, logoSrc, showWatermark, pageNumber, pageCount }) {
  return (
    <article className="invoice-print-page relative h-[905px] w-[640px] max-w-full overflow-hidden rounded-2xl border border-stone-200 bg-white p-8 text-stone-950 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] dark:border-stone-800 dark:bg-white dark:text-stone-950">
      {showWatermark && logoSrc && (
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[48%] z-0 h-56 max-w-[70%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.055] grayscale"
        />
      )}

      <div className="relative z-10 flex h-full flex-col">
        {children}
        <footer className="mt-auto flex items-center justify-between border-t border-stone-200 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400">
          <span>RechargeNet</span>
          <span>Page {pageNumber} / {pageCount}</span>
        </footer>
      </div>
    </article>
  );
}

function FullHeader({ documento, azienda, logoSrc, showHeaderLogo }) {
  return (
    <div className="flex items-start justify-between gap-8 border-b border-stone-200 pb-8">
      <div className="min-w-0">
        {showHeaderLogo && (
          logoSrc ? (
            <img src={logoSrc} alt="Logo azienda" className="mb-5 h-14 max-w-44 object-contain object-left" />
          ) : (
            <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand-soft)] text-[var(--brand-text)]">
              <ReceiptText className="h-6 w-6" />
            </div>
          )
        )}
        <h2 className="text-lg font-semibold text-stone-950">{azienda?.ragioneSociale || "Dati azienda non configurati"}</h2>
        <p className="mt-1 max-w-sm text-sm text-stone-500">{azienda?.indirizzo || "Indirizzo non disponibile"}</p>
        {azienda?.matriculeFiscale && (
          <p className="mt-1 text-sm text-stone-500">MF {azienda.matriculeFiscale}</p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">{getTipoLabel(documento?.tipo)}</p>
        <p className="mt-2 text-xl font-semibold tabular-nums text-stone-950">{documento?.numero || "Automatico"}</p>
        <p className="mt-1 text-sm text-stone-500">{formatDate(documento?.dataEmissione)}</p>
        <p className="mt-4 inline-flex rounded-full border border-[var(--brand-border)] bg-[var(--brand-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--brand-text)]">
          {documento?.stato || "BOZZA"}
        </p>
      </div>
    </div>
  );
}

function CompactHeader({ documento, azienda }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-stone-200 pb-5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-stone-950">{azienda?.ragioneSociale || "Dati azienda non configurati"}</p>
        <p className="mt-1 text-xs text-stone-500">Suite document</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">{getTipoLabel(documento?.tipo)}</p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-stone-950">{documento?.numero || "Automatico"}</p>
      </div>
    </div>
  );
}

function ClientBlock({ documento }) {
  return (
    <div className="grid gap-5 border-b border-stone-200 py-7 sm:grid-cols-2">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Cliente</p>
        <p className="mt-2 text-base font-semibold text-stone-950">{documento?.nomeCliente || "Client passager"}</p>
      </div>
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">Boutique / origine</p>
        <p className="mt-2 text-base font-semibold text-stone-950">
          {documento?.fatturaOrigineNumero || documento?.nomeBoutique || "Admin"}
        </p>
      </div>
    </div>
  );
}

function RowsTable({ rows }) {
  return (
    <div className="py-7">
      <table className="w-full">
        <thead>
          <tr className="border-b border-stone-200 text-left text-[10px] font-semibold uppercase tracking-[0.13em] text-stone-400">
            <th className="w-[58px] py-3 pr-3">Ref</th>
            <th className="py-3 pr-3">Designation</th>
            <th className="py-3 text-right">Qte</th>
            <th className="py-3 text-right">Prix HT</th>
            <th className="py-3 text-right">Remise</th>
            <th className="py-3 text-right">TVA</th>
            <th className="py-3 text-right">Montant HT</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((riga) => (
            <tr key={riga.id} className="border-b border-stone-100 text-sm">
              <td className="py-4 pr-3 tabular-nums text-stone-500">{riga.reference || "-"}</td>
              <td className="py-4 pr-3 text-stone-800">{riga.descrizione || "Article"}</td>
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
  );
}

function TotalsBlock({ documento, totals }) {
  return (
    <div className="ml-auto w-full max-w-sm space-y-3 border-t border-stone-200 pt-5">
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-500">Sous-total HT</span>
        <span className="font-medium tabular-nums text-stone-950">{formatMoney(totals.totaleHT)}</span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-500">Remise globale</span>
        <span className="font-medium tabular-nums text-stone-950">-{formatMoney(totals.remiseGlobale)}</span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-500">Total HT net</span>
        <span className="font-medium tabular-nums text-stone-950">{formatMoney(totals.totaleHTNet)}</span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-500">Total TVA</span>
        <span className="font-medium tabular-nums text-stone-950">{formatMoney(totals.totaleTVA)}</span>
      </div>
      {documento?.timbreFiscal && (
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-stone-500">Timbre fiscal</span>
          <span className="font-medium tabular-nums text-stone-950">{formatMoney(totals.timbreFiscalMontant)}</span>
        </div>
      )}
      <div className="flex justify-between gap-4 rounded-2xl bg-[var(--brand-soft)] px-4 py-3">
        <span className="font-semibold text-[var(--brand-text)]">Net a payer</span>
        <span className="font-semibold tabular-nums text-stone-950">{formatMoney(totals.totaleNet)}</span>
      </div>
    </div>
  );
}

export default function FatturaDocumentPreview({
  documento,
  azienda,
  className = "",
  timbreFiscalValue = TIMBRE_FISCAL_DEFAULT,
}) {
  const rows = getRows(documento);
  const pages = paginateRows(rows);
  const totals = getTotals(documento, timbreFiscalValue);
  const logoSrc = getLogoSrc(azienda?.logo);
  const showHeaderLogo = documento?.logoIntestazioneVisibile !== false;
  const showWatermark = Boolean(documento?.logoWatermarkVisibile);

  return (
    <div className={["invoice-print-area flex w-full flex-col items-center gap-5", className].join(" ")}>
      {pages.map((pageRows, pageIndex) => {
        const isFirstPage = pageIndex === 0;
        const isLastPage = pageIndex === pages.length - 1;

        return (
          <PageFrame
            key={`page-${pageIndex}`}
            logoSrc={logoSrc}
            showWatermark={showWatermark}
            pageNumber={pageIndex + 1}
            pageCount={pages.length}
          >
            {isFirstPage ? (
              <>
                <FullHeader documento={documento} azienda={azienda} logoSrc={logoSrc} showHeaderLogo={showHeaderLogo} />
                <ClientBlock documento={documento} />
              </>
            ) : (
              <CompactHeader documento={documento} azienda={azienda} />
            )}

            <RowsTable rows={pageRows} />
            {isLastPage && <TotalsBlock documento={documento} totals={totals} />}
          </PageFrame>
        );
      })}
    </div>
  );
}
