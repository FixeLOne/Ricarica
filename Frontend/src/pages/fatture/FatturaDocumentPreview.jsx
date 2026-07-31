import { useEffect, useMemo, useRef } from "react";

import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import {
  calcolaRiga,
  calcolaTotaliDocumento,
  getLogoSrc,
  getTipoLabel,
  TIMBRE_FISCAL_DEFAULT,
} from "./fatturaHelpers";
import {
  INVOICE_PAGE_HEIGHT,
  INVOICE_PAGE_PADDING,
  INVOICE_PAGE_WIDTH,
} from "./invoiceLayout";
import {
  useInvoicePagination,
  useInvoiceViewportLayout,
} from "./useInvoiceLayout";

function getRows(documento) {
  return (documento?.righe ?? []).map((riga, index) => ({
    ...riga,
    id: riga.id ?? riga.localId ?? index,
    ...calcolaRiga(riga),
  }));
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
    totaleHTNet:
      documento?.totaleHTNet ??
      Math.max(Number(totals.totaleHT ?? 0) - Number(totals.remiseGlobale ?? 0), 0),
  };
}

function PageFooter({ azienda, pageNumber, pageCount, className = "" }) {
  return (
    <footer
      className={[
        "flex items-center justify-between border-t border-stone-200 pt-4 text-[10px] font-medium uppercase tracking-[0.14em] text-stone-400",
        className,
      ].join(" ")}
    >
      <span>{azienda?.ragioneSociale || "RechargeNet"}</span>
      {pageNumber != null && pageCount != null && (
        <span>
          Page {pageNumber} / {pageCount}
        </span>
      )}
    </footer>
  );
}

function PageFrame({
  children,
  azienda,
  logoSrc,
  showWatermark,
  pageNumber,
  pageCount,
  hasTotals,
}) {
  return (
    <article
      className="invoice-print-page relative shrink-0 overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-950 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] dark:border-stone-800 dark:bg-white dark:text-stone-950"
      style={{
        width: INVOICE_PAGE_WIDTH,
        height: INVOICE_PAGE_HEIGHT,
        padding: INVOICE_PAGE_PADDING,
      }}
    >
      {showWatermark && logoSrc && (
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[48%] z-0 h-56 max-w-[70%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.055] grayscale"
        />
      )}

      <div className="relative z-10 flex h-full min-h-0 flex-col">
        {children}
        <PageFooter
          azienda={azienda}
          pageNumber={pageNumber}
          pageCount={pageCount}
          className={hasTotals ? "" : "mt-auto"}
        />
      </div>
    </article>
  );
}

function FullHeader({ documento, azienda, logoSrc, showHeaderLogo }) {
  return (
    <div className="flex items-start justify-between gap-8 border-b border-stone-200 pb-8">
      <div className="min-w-0">
        {showHeaderLogo && logoSrc && (
          <img
            src={logoSrc}
            alt="Logo azienda"
            className="mb-5 h-14 max-w-44 object-contain object-left"
          />
        )}
        <h2 className="text-lg font-semibold text-stone-950">
          {azienda?.ragioneSociale || "Dati azienda non configurati"}
        </h2>
        <p className="mt-1 max-w-sm text-sm text-stone-500">
          {azienda?.indirizzo || "Indirizzo non disponibile"}
        </p>
        {azienda?.matriculeFiscale && (
          <p className="mt-1 text-sm text-stone-500">
            MF {azienda.matriculeFiscale}
          </p>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">
          {getTipoLabel(documento?.tipo)}
        </p>
        <p className="mt-2 text-xl font-semibold tabular-nums text-stone-950">
          {documento?.numero || "Automatico"}
        </p>
        <p className="mt-1 text-sm text-stone-500">
          {formatDate(documento?.dataEmissione)}
        </p>
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
        <p className="truncate text-sm font-semibold text-stone-950">
          {azienda?.ragioneSociale || "Dati azienda non configurati"}
        </p>
        <p className="mt-1 text-xs text-stone-500">Suite du document</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--brand-text)]">
          {getTipoLabel(documento?.tipo)}
        </p>
        <p className="mt-1 text-sm font-semibold tabular-nums text-stone-950">
          {documento?.numero || "Automatico"}
        </p>
      </div>
    </div>
  );
}

function ClientBlock({ documento }) {
  return (
    <div className="border-b border-stone-200 py-7">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-400">
          Cliente
        </p>
        <p className="mt-2 text-base font-semibold text-stone-950">
          {documento?.nomeCliente || "Client passager"}
        </p>
      </div>
      {documento?.fatturaOrigineNumero && (
        <div className="mt-5 flex items-center justify-between gap-4 border-t border-stone-100 pt-4">
          <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-stone-400">
            Document d'origine
          </span>
          <span className="text-sm font-semibold tabular-nums text-stone-950">
            {documento.fatturaOrigineNumero}
          </span>
        </div>
      )}
    </div>
  );
}

function TableColumns() {
  return (
    <colgroup>
      <col className="w-[9%]" />
      <col className="w-[28%]" />
      <col className="w-[7%]" />
      <col className="w-[15%]" />
      <col className="w-[12%]" />
      <col className="w-[9%]" />
      <col className="w-[20%]" />
    </colgroup>
  );
}

function TableHeader() {
  return (
    <thead>
      <tr className="border-b border-stone-200 text-left text-[10px] font-semibold uppercase tracking-[0.11em] text-stone-400">
        <th className="py-3 pr-2">Ref</th>
        <th className="py-3 pr-2">Designation</th>
        <th className="py-3 text-right">Qte</th>
        <th className="py-3 text-right">Prix HT</th>
        <th className="py-3 text-right">Remise</th>
        <th className="py-3 text-right">TVA</th>
        <th className="py-3 text-right">Montant HT</th>
      </tr>
    </thead>
  );
}

function InvoiceRow({ riga, measure = false, isActive = false }) {
  return (
    <tr
      data-invoice-row-measure={measure ? "" : undefined}
      className={[
        "border-b border-stone-100 align-top text-sm transition-colors",
        isActive ? "bg-[var(--brand-soft)]" : "",
      ].join(" ")}
    >
      <td className="break-words py-4 pr-2 tabular-nums text-stone-500">
        {riga.reference || "-"}
      </td>
      <td className="break-words py-4 pr-2 leading-5 text-stone-800">
        {riga.descrizione || "Article"}
      </td>
      <td className="whitespace-nowrap py-4 text-right tabular-nums text-stone-600">
        {Number(riga.quantita ?? 0).toLocaleString("it-IT")}
      </td>
      <td className="whitespace-nowrap py-4 text-right tabular-nums text-stone-600">
        {formatMoney(riga.prezzoUnitarioHT)}
      </td>
      <td className="whitespace-nowrap py-4 text-right tabular-nums text-stone-600">
        {formatPercent(riga.scontoPercentuale)}
      </td>
      <td className="whitespace-nowrap py-4 text-right tabular-nums text-stone-600">
        {formatPercent(riga.aliquotaTVA)}
      </td>
      <td className="whitespace-nowrap py-4 text-right tabular-nums font-medium text-stone-950">
        {formatMoney(riga.montanteHT)}
      </td>
    </tr>
  );
}

function RowsTable({ rows, activeRowIndex }) {
  return (
    <div className="py-7">
      <table className="w-full table-fixed">
        <TableColumns />
        <TableHeader />
        <tbody>
          {rows.map((riga, index) => (
            <InvoiceRow key={riga.id} riga={riga} isActive={activeRowIndex === index} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TotalsBlock({ documento, totals }) {
  const isAvoir = documento?.tipo === "AVOIR";

  return (
    <div className="mt-auto ml-auto w-full max-w-sm space-y-3 border-t border-stone-200 pb-5 pt-5">
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-500">Sous-total HT</span>
        <span className="font-medium tabular-nums text-stone-950">
          {formatMoney(totals.totaleHT)}
        </span>
      </div>
      {Number(totals.remiseGlobale ?? 0) > 0 && (
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-stone-500">Remise globale</span>
          <span className="font-medium tabular-nums text-stone-950">
            -{formatMoney(totals.remiseGlobale)}
          </span>
        </div>
      )}
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-500">Total HT net</span>
        <span className="font-medium tabular-nums text-stone-950">
          {formatMoney(totals.totaleHTNet)}
        </span>
      </div>
      <div className="flex justify-between gap-4 text-sm">
        <span className="text-stone-500">Total TVA</span>
        <span className="font-medium tabular-nums text-stone-950">
          {formatMoney(totals.totaleTVA)}
        </span>
      </div>
      {documento?.timbreFiscal && (
        <div className="flex justify-between gap-4 text-sm">
          <span className="text-stone-500">Timbre fiscal</span>
          <span className="font-medium tabular-nums text-stone-950">
            {formatMoney(totals.timbreFiscalMontant)}
          </span>
        </div>
      )}
      <div className="flex justify-between gap-4 rounded-2xl bg-[var(--brand-soft)] px-4 py-3">
        <span className="font-semibold text-[var(--brand-text)]">
          {isAvoir ? "Net a crediter" : "Net a payer"}
        </span>
        <span className="font-semibold tabular-nums text-stone-950">
          {formatMoney(totals.totaleNet)}
        </span>
      </div>
    </div>
  );
}

function MeasurementLayer({
  measurementRef,
  documento,
  azienda,
  logoSrc,
  showHeaderLogo,
  rows,
  totals,
}) {
  return (
    <div
      ref={measurementRef}
      aria-hidden="true"
      className="pointer-events-none fixed -left-[10000px] top-0 invisible"
      style={{
        width: INVOICE_PAGE_WIDTH - INVOICE_PAGE_PADDING * 2,
      }}
    >
      <div data-measure-full-header>
        <FullHeader
          documento={documento}
          azienda={azienda}
          logoSrc={logoSrc}
          showHeaderLogo={showHeaderLogo}
        />
      </div>
      <div data-measure-client>
        <ClientBlock documento={documento} />
      </div>
      <div data-measure-compact-header>
        <CompactHeader documento={documento} azienda={azienda} />
      </div>
      <div data-measure-table-chrome>
        <RowsTable rows={[]} />
      </div>
      <div data-measure-totals>
        <TotalsBlock documento={documento} totals={totals} />
      </div>
      <div data-measure-footer>
        <PageFooter azienda={azienda} pageNumber={1} pageCount={1} />
      </div>
      <table className="w-full table-fixed">
        <TableColumns />
        <tbody>
          {rows.map((riga) => (
            <InvoiceRow key={riga.id} riga={riga} measure />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ScaledPage({ scale, children }) {
  return (
    <div
      className="invoice-page-slot shrink-0"
      style={{
        width: INVOICE_PAGE_WIDTH * scale,
        height: INVOICE_PAGE_HEIGHT * scale,
      }}
    >
      <div
        className="invoice-page-scale origin-top-left"
        style={{
          width: INVOICE_PAGE_WIDTH,
          height: INVOICE_PAGE_HEIGHT,
          transform: `scale(${scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Vista a flusso continuo usata mentre il documento e in modifica: nessuna
// suddivisione in pagine A4, nessuna misurazione del DOM per calcolarla —
// la lista di righe cresce semplicemente in altezza. E il pattern delle app
// di fatturazione moderne (Stripe, QuickBooks...): durante l'editing si vede
// un elenco fluido, la vera impaginazione A4 si applica solo alla stampa o
// quando il documento non e piu modificabile, quando il contenuto e stabile
// e un ricalcolo non puo piu interrompere la scrittura con un salto visibile.
function FlowPage({
  documento,
  azienda,
  logoSrc,
  showHeaderLogo,
  showWatermark,
  rows,
  totals,
  activeRowIndex,
  className = "",
}) {
  return (
    <article
      className={[
        "invoice-flow-page relative w-full max-w-[640px] overflow-hidden rounded-2xl border border-stone-200 bg-white text-stone-950 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.55)] dark:border-stone-800 dark:bg-white dark:text-stone-950",
        className,
      ].join(" ")}
      style={{ padding: INVOICE_PAGE_PADDING }}
    >
      {showWatermark && logoSrc && (
        <img
          src={logoSrc}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-[40%] z-0 h-56 max-w-[70%] -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.055] grayscale"
        />
      )}
      <div className="relative z-10 flex flex-col">
        <FullHeader
          documento={documento}
          azienda={azienda}
          logoSrc={logoSrc}
          showHeaderLogo={showHeaderLogo}
        />
        <ClientBlock documento={documento} />
        <RowsTable rows={rows} activeRowIndex={activeRowIndex} />
        <TotalsBlock documento={documento} totals={totals} />
        <PageFooter azienda={azienda} />
      </div>
    </article>
  );
}

export default function FatturaDocumentPreview({
  documento,
  azienda,
  className = "",
  fitPageToViewport = false,
  timbreFiscalValue = TIMBRE_FISCAL_DEFAULT,
  activeRowIndex = null,
  editable = false,
}) {
  const measurementRef = useRef(null);
  const containerRef = useRef(null);
  const rows = useMemo(() => getRows(documento), [documento]);
  const totals = useMemo(
    () => getTotals(documento, timbreFiscalValue),
    [documento, timbreFiscalValue],
  );
  const logoSrc = getLogoSrc(azienda?.logo);
  const showHeaderLogo = documento?.logoIntestazioneVisibile !== false;
  const showWatermark = Boolean(documento?.logoWatermarkVisibile);
  const layoutKey = JSON.stringify({
    azienda: [
      azienda?.ragioneSociale,
      azienda?.indirizzo,
      azienda?.matriculeFiscale,
      Boolean(logoSrc),
    ],
    documento: [
      documento?.tipo,
      documento?.numero,
      documento?.stato,
      documento?.nomeCliente,
      documento?.fatturaOrigineNumero,
      documento?.timbreFiscal,
      showHeaderLogo,
    ],
    rows: rows.map((riga) => [
      riga.id,
      riga.reference,
      riga.descrizione,
      riga.quantita,
      riga.prezzoUnitarioHT,
      riga.scontoPercentuale,
      riga.aliquotaTVA,
    ]),
  });
  const pageIndexes = useInvoicePagination({
    measurementRef,
    rowCount: rows.length,
    layoutKey,
  });
  const { scale, topOffset } = useInvoiceViewportLayout({
    contentRef: containerRef,
    fitPageToViewport,
  });

  // Porta in vista la pagina che contiene la riga in modifica nell'editor.
  // Rilevante solo quando la vista paginata e quella mostrata a schermo
  // (documento non modificabile): mentre si edita e nascosta fuori schermo
  // per la stampa, e scrollarla non avrebbe alcun effetto visibile.
  // Scrolliamo manualmente SOLO il contenitore diretto (la section con
  // overflow-auto), mai con scrollIntoView: quel metodo risale alla ricerca
  // del primo antenato scrollabile, e su schermi dove questa sezione non ha
  // un'altezza vincolata (mobile, colonna singola) risalirebbe fino a "main"
  // — scrollando l'INTERA pagina invece della sola anteprima.
  useEffect(() => {
    if (editable || activeRowIndex == null) return;
    const pageIdx = pageIndexes.findIndex((indexes) => indexes.includes(activeRowIndex));
    if (pageIdx < 0) return;
    const pageEl = containerRef.current?.children[pageIdx];
    // scrollParent e il genitore di containerRef (.invoice-print-area), non
    // di pageEl: pageEl.parentElement e containerRef.current stesso.
    const scrollParent = containerRef.current?.parentElement;
    if (!pageEl || !scrollParent) return;
    const delta = pageEl.getBoundingClientRect().top - scrollParent.getBoundingClientRect().top;
    scrollParent.scrollTop += delta;
  }, [editable, activeRowIndex, pageIndexes]);

  return (
    <>
      <MeasurementLayer
        measurementRef={measurementRef}
        documento={documento}
        azienda={azienda}
        logoSrc={logoSrc}
        showHeaderLogo={showHeaderLogo}
        rows={rows}
        totals={totals}
      />

      {editable && (
        <div className="flex w-full justify-center">
          <FlowPage
            documento={documento}
            azienda={azienda}
            logoSrc={logoSrc}
            showHeaderLogo={showHeaderLogo}
            showWatermark={showWatermark}
            rows={rows}
            totals={totals}
            activeRowIndex={activeRowIndex}
            className={className}
          />
        </div>
      )}

      {/* Vista paginata A4: sempre calcolata (pronta per la stampa), ma
          visibile a schermo solo quando NON si sta editando (readOnly). In
          modifica resta fuori schermo — la stampa la mostra comunque, perche
          il CSS @media print forza position:absolute!important su questa
          stessa classe indipendentemente da dove si trova sullo schermo. */}
      <div
        ref={containerRef}
        aria-hidden={editable ? "true" : undefined}
        className={[
          "invoice-print-area flex min-h-full w-full flex-col items-center justify-start gap-5",
          editable ? "" : className,
        ].join(" ")}
        style={
          editable
            ? { paddingTop: topOffset, position: "fixed", left: "-10000px", top: 0 }
            : { paddingTop: topOffset }
        }
      >
        {pageIndexes.map((indexes, pageIndex) => {
          const isFirstPage = pageIndex === 0;
          const isLastPage = pageIndex === pageIndexes.length - 1;
          const pageRows = indexes.map((rowIndex) => rows[rowIndex]);

          return (
            <ScaledPage key={`page-${pageIndex}`} scale={scale}>
              <PageFrame
                azienda={azienda}
                logoSrc={logoSrc}
                showWatermark={showWatermark}
                pageNumber={pageIndex + 1}
                pageCount={pageIndexes.length}
                hasTotals={isLastPage}
              >
                {isFirstPage ? (
                  <>
                    <FullHeader
                      documento={documento}
                      azienda={azienda}
                      logoSrc={logoSrc}
                      showHeaderLogo={showHeaderLogo}
                    />
                    <ClientBlock documento={documento} />
                  </>
                ) : (
                  <CompactHeader documento={documento} azienda={azienda} />
                )}

                <RowsTable rows={pageRows} />
                {isLastPage && (
                  <TotalsBlock documento={documento} totals={totals} />
                )}
              </PageFrame>
            </ScaledPage>
          );
        })}
      </div>
    </>
  );
}
