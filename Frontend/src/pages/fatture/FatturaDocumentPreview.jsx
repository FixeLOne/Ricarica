import { useEffect, useMemo, useRef } from "react";

import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import {
  calcolaRiepilogoTva,
  calcolaRiga,
  calcolaTotaliDocumento,
  getLogoSrc,
  getTipoLabel,
  importoInLettere,
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
  // Contatti facoltativi: compaiono solo se l'admin li ha compilati.
  const contatti = [azienda?.telefono, azienda?.email, azienda?.sitoWeb].filter(Boolean);

  return (
    <footer className={["border-t border-stone-200/80 pt-3", className].join(" ")}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {azienda?.ragioneSociale && (
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-stone-500">
              {azienda.ragioneSociale}
            </p>
          )}
          {contatti.length > 0 && (
            <p className="mt-0.5 truncate text-[10px] text-stone-400">
              {contatti.join("  ·  ")}
            </p>
          )}
        </div>
        {pageNumber != null && pageCount != null && (
          <span className="shrink-0 text-[10px] font-medium tabular-nums text-stone-400">
            {pageNumber} / {pageCount}
          </span>
        )}
      </div>
    </footer>
  );
}

// Nota: un documento stornato NON viene marcato sulla stampa (niente
// filigrana, niente importi barrati). Una fattura emessa resta un documento
// fiscale valido e archiviato: la sua ristampa deve essere identica a quanto
// emesso e — con la fatturazione elettronica — a quanto registrato presso
// TTN. E l'avoir a rettificarla. Lo stato di storno si comunica
// nell'interfaccia (lista ed editor), mai alterando il documento.

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

/** Etichetta piccola in maiuscoletto: unico stile per tutte le didascalie. */
function Eyebrow({ children, className = "" }) {
  return (
    <p className={`text-[9px] font-semibold uppercase tracking-[0.2em] text-stone-400 ${className}`}>
      {children}
    </p>
  );
}

function StatoBadge({ stato }) {
  const annullata = stato === "ANNULLATA";
  return (
    <span
      className={[
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em]",
        annullata
          ? "bg-stone-100 text-stone-500"
          : "bg-[var(--invoice-accent-soft)] text-[var(--invoice-accent)]",
      ].join(" ")}
    >
      {stato || "BOZZA"}
    </span>
  );
}

function FullHeader({ documento, azienda, logoSrc, showHeaderLogo }) {
  return (
    <div className="pb-6">
      {/* Filetto d'accento in testa al foglio: da carattere al documento
          senza aggiungere peso visivo alle informazioni. */}
      <div className="mb-6 h-1 w-16 rounded-full bg-[var(--invoice-accent)]" />

      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          {showHeaderLogo && logoSrc && (
            <img
              src={logoSrc}
              alt="Logo azienda"
              className="mb-4 h-12 max-w-40 object-contain object-left"
            />
          )}
          {/* Nessun segnaposto inventato: finche l'azienda non e configurata
              il documento resta semplicemente vuoto in queste righe, invece
              di stampare testi finti che sembrano dati reali. */}
          {azienda?.ragioneSociale && (
            <h2 className="text-base font-bold leading-tight text-stone-900">
              {azienda.ragioneSociale}
            </h2>
          )}
          {azienda?.indirizzo && (
            <p className="mt-1.5 max-w-[15rem] text-xs leading-relaxed text-stone-500">
              {azienda.indirizzo}
            </p>
          )}
          {azienda?.matriculeFiscale && (
            <p className="mt-0.5 text-xs text-stone-500">MF {azienda.matriculeFiscale}</p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <h1 className="text-2xl font-bold uppercase leading-none tracking-tight text-[var(--invoice-accent)]">
            {getTipoLabel(documento?.tipo)}
          </h1>
          <p className="mt-2 text-sm font-semibold tabular-nums text-stone-900">
            {documento?.numero || "Automatico"}
          </p>
          <p className="mt-0.5 text-xs tabular-nums text-stone-500">
            {formatDate(documento?.dataEmissione)}
          </p>
          <div className="mt-3 flex justify-end">
            <StatoBadge stato={documento?.stato} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CompactHeader({ documento, azienda }) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-stone-200 pb-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="h-6 w-1 shrink-0 rounded-full bg-[var(--invoice-accent)]" />
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-stone-900">
            {azienda?.ragioneSociale || ""}
          </p>
          <p className="text-[11px] text-stone-400">Suite du document</p>
        </div>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--invoice-accent)]">
          {getTipoLabel(documento?.tipo)}
        </p>
        <p className="mt-0.5 text-sm font-semibold tabular-nums text-stone-900">
          {documento?.numero || "Automatico"}
        </p>
      </div>
    </div>
  );
}

function ClientBlock({ documento }) {
  return (
    <div className="pb-6">
      {/* Il destinatario e la prima cosa che si cerca: sta in un pannello
          dedicato invece di essere una riga di testo come le altre. */}
      <div className="rounded-xl border border-stone-200/80 bg-stone-50/60 px-4 py-3.5">
        <Eyebrow>Facturé à</Eyebrow>
        <p className="mt-1.5 text-sm font-bold text-stone-900">
          {documento?.nomeCliente || "Client passager"}
        </p>
        {documento?.indirizzoCliente && (
          <p className="mt-1 max-w-sm text-xs leading-relaxed text-stone-500">
            {documento.indirizzoCliente}
          </p>
        )}
        {documento?.matriculeFiscaleCliente && (
          <p className="mt-0.5 text-xs text-stone-500">MF {documento.matriculeFiscaleCliente}</p>
        )}
        {documento?.fatturaOrigineNumero && (
          <p className="mt-2.5 border-t border-stone-200/80 pt-2 text-[11px] text-stone-500">
            Document d'origine{" "}
            <span className="font-semibold tabular-nums text-stone-700">
              {documento.fatturaOrigineNumero}
            </span>
          </p>
        )}
      </div>
    </div>
  );
}

function TableColumns() {
  return (
    <colgroup>
      {/* Ref abbastanza larga da non spezzare codici tipo "SRV-01" */}
      <col className="w-[11%]" />
      <col className="w-[27%]" />
      <col className="w-[6%]" />
      <col className="w-[15%]" />
      <col className="w-[10%]" />
      <col className="w-[8%]" />
      <col className="w-[23%]" />
    </colgroup>
  );
}

function TableHeader() {
  return (
    <thead>
      {/* Intestazione su fondo tenue: separa la tabella dal resto del foglio
          senza bisogno di bordi pesanti su ogni cella. */}
      <tr className="bg-stone-50 text-left text-[9px] font-semibold uppercase tracking-[0.14em] text-stone-500">
        <th className="rounded-l-lg py-2.5 pl-3 pr-2">Réf</th>
        <th className="py-2.5 pr-2">Désignation</th>
        <th className="py-2.5 pr-2 text-right">Qté</th>
        <th className="py-2.5 pr-2 text-right">Prix HT</th>
        <th className="py-2.5 pr-2 text-right">Remise</th>
        <th className="py-2.5 pr-2 text-right">TVA</th>
        <th className="rounded-r-lg py-2.5 pr-3 text-right">Montant HT</th>
      </tr>
    </thead>
  );
}

function InvoiceRow({ riga, measure = false, isActive = false }) {
  return (
    <tr
      data-invoice-row-measure={measure ? "" : undefined}
      data-riga-attiva={!measure && isActive ? "" : undefined}
      className={[
        "border-b border-stone-100 align-top text-[13px]",
        isActive ? "bg-[var(--invoice-accent-soft)]" : "",
      ].join(" ")}
    >
      <td className="break-words py-3 pl-3 pr-2 text-[11px] tabular-nums text-stone-400">
        {riga.reference || "—"}
      </td>
      <td className="break-words py-3 pr-2 font-medium leading-5 text-stone-800">
        {riga.descrizione || "Article"}
      </td>
      <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums text-stone-600">
        {Number(riga.quantita ?? 0).toLocaleString("it-IT")}
      </td>
      <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums text-stone-600">
        {formatMoney(riga.prezzoUnitarioHT)}
      </td>
      <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums text-stone-400">
        {formatPercent(riga.scontoPercentuale)}
      </td>
      <td className="whitespace-nowrap py-3 pr-2 text-right tabular-nums text-stone-400">
        {formatPercent(riga.aliquotaTVA)}
      </td>
      <td className="whitespace-nowrap py-3 pr-3 text-right font-semibold tabular-nums text-stone-900">
        {formatMoney(riga.montanteHT)}
      </td>
    </tr>
  );
}

function RowsTable({ rows, activeRowIndex }) {
  return (
    <div className="pb-6">
      <table className="w-full table-fixed border-separate border-spacing-0">
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

function TotalsBlock({ documento, totals, riepilogoTva = [] }) {
  const isAvoir = documento?.tipo === "AVOIR";
  const conRemise = Number(totals.remiseGlobale ?? 0) > 0;
  // Con piu aliquote il totale TVA aggregato non basta: si dettaglia base e
  // imposta per ciascuna. Con una sola aliquota il dettaglio ripeterebbe il
  // totale, quindi resta la riga singola.
  const dettaglioTva = riepilogoTva.length > 1 ? riepilogoTva : [];

  const riga = (etichetta, valore, opzioni = {}) => (
    <div className="flex items-baseline justify-between gap-4 text-[13px]">
      <span className={opzioni.muted ? "text-stone-400" : "text-stone-500"}>{etichetta}</span>
      <span className="font-medium tabular-nums text-stone-700">{valore}</span>
    </div>
  );

  return (
    <div className="mt-auto w-full pt-2">
      {/* Formula in lettere affiancata ai totali invece che sotto: occupa lo
          spazio altrimenti vuoto a sinistra e fa risparmiare ~50px di
          altezza, che spesso decidono se il documento sta in una pagina. */}
      <div className="flex items-end justify-between gap-6">
        <p className="min-w-0 flex-1 border-l-2 border-[var(--invoice-accent-border)] pl-3 text-[11px] italic leading-snug text-stone-500">
          {isAvoir ? "Arrêté le présent avoir" : "Arrêtée la présente facture"} à la somme de{" "}
          <span className="font-semibold not-italic text-stone-700">
            {importoInLettere(totals.totaleNet)}
          </span>
          .
        </p>

        <div className="w-[17rem] shrink-0">
          <div className="space-y-1.5 border-t border-stone-200 pt-3">
            {/* Senza remise, "Sous-total HT" e "Total HT net" sarebbero lo
                stesso numero due volte: si mostra un solo imponibile. */}
            {conRemise ? (
              <>
                {riga("Sous-total HT", formatMoney(totals.totaleHT))}
                {riga("Remise globale", `−${formatMoney(totals.remiseGlobale)}`)}
                {riga("Total HT net", formatMoney(totals.totaleHTNet))}
              </>
            ) : (
              riga("Total HT", formatMoney(totals.totaleHTNet))
            )}

            {dettaglioTva.map((voce) => (
              <div
                key={String(voce.aliquota)}
                className="flex items-baseline justify-between gap-4 text-[12px]"
              >
                <span className="text-stone-400">
                  TVA {formatPercent(voce.aliquota)} sur {formatMoney(voce.imponibile)}
                </span>
                <span className="tabular-nums text-stone-500">{formatMoney(voce.imposta)}</span>
              </div>
            ))}

            {riga("Total TVA", formatMoney(totals.totaleTVA))}
            {documento?.timbreFiscal && riga("Timbre fiscal", formatMoney(totals.timbreFiscalMontant))}
          </div>

          {/* L'importo dovuto e l'informazione che si cerca per prima:
              blocco pieno d'accento, cifra grande, tutto il resto smorzato.
              Resta identico anche se il documento e stato stornato: la
              ristampa deve corrispondere a quanto emesso. */}
          <div className="mt-3 rounded-xl bg-[var(--invoice-accent)] px-4 py-3 text-[var(--invoice-accent-contrast)]">
            <p className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-80">
              {isAvoir ? "Net à créditer" : "Net à payer"}
            </p>
            <p className="mt-0.5 text-xl font-bold leading-none tabular-nums">
              {formatMoney(totals.totaleNet)}
            </p>
          </div>
        </div>
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
  riepilogoTva,
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
        <TotalsBlock documento={documento} totals={totals} riepilogoTva={riepilogoTva} />
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
  riepilogoTva,
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
        <TotalsBlock documento={documento} totals={totals} riepilogoTva={riepilogoTva} />
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
  const riepilogoTva = useMemo(() => calcolaRiepilogoTva(documento), [documento]);
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

  const flowRef = useRef(null);

  // In modifica il documento e una pagina continua: qui si porta in vista la
  // riga su cui si sta scrivendo. Si scorre solo se la riga e davvero fuori
  // dalla finestra visibile — altrimenti ogni clic su una riga gia in vista
  // farebbe sobbalzare l'anteprima. Vale lo stesso divieto di scrollIntoView
  // spiegato sotto: si muove a mano il solo contenitore.
  useEffect(() => {
    if (!editable || activeRowIndex == null) return;
    const contenitore = flowRef.current;
    const vista = contenitore?.parentElement;
    const riga = contenitore?.querySelector("[data-riga-attiva]");
    if (!riga || !vista) return;

    const MARGINE = 24;
    const rigaBox = riga.getBoundingClientRect();
    const vistaBox = vista.getBoundingClientRect();

    let delta = 0;

    // Sull'ultima riga si inquadra la fine del documento invece della sola
    // riga: quello che stai riempiendo e il totale che alimenta. Non e un
    // compromesso, la coda (totali, importo in lettere, piede) misura 280-400px
    // contro un pannello da 740 in su, quindi la riga resta comunque in vista.
    // La condizione guarda la posizione, non l'azione: duplicare una riga a
    // meta documento continua a portare li, e sarebbe sbagliato mostrare i
    // totali. Se la coda e insolitamente alta — molte aliquote nel riepilogo,
    // importo in lettere su piu righe — si ripiega sulla sola riga.
    const pagina = contenitore.firstElementChild;
    if (pagina && activeRowIndex === rows.length - 1) {
      const versoLaFine = pagina.getBoundingClientRect().bottom - vistaBox.bottom + MARGINE;
      const rigaResterebbeInVista = rigaBox.top - versoLaFine >= vistaBox.top + MARGINE;
      if (versoLaFine > 0 && rigaResterebbeInVista) delta = versoLaFine;
    }

    if (delta === 0) {
      if (rigaBox.top < vistaBox.top + MARGINE) {
        delta = rigaBox.top - vistaBox.top - MARGINE;
      } else if (rigaBox.bottom > vistaBox.bottom - MARGINE) {
        delta = rigaBox.bottom - vistaBox.bottom + MARGINE;
      }
    }
    if (delta === 0) return;

    vista.scrollTo({ top: vista.scrollTop + delta, behavior: "smooth" });
  }, [editable, activeRowIndex, rows.length]);

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
        riepilogoTva={riepilogoTva}
      />

      {editable && (
        <div ref={flowRef} className="flex w-full justify-center">
          <FlowPage
            documento={documento}
            azienda={azienda}
            logoSrc={logoSrc}
            showHeaderLogo={showHeaderLogo}
            showWatermark={showWatermark}
            rows={rows}
            totals={totals}
            riepilogoTva={riepilogoTva}
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

                {/* Nell'ultima pagina puo non esserci nessuna riga (i totali
                    non entravano sotto l'ultima): in quel caso si omette
                    anche l'intestazione della tabella, che resterebbe a
                    sovrastare il vuoto. */}
                {pageRows.length > 0 && <RowsTable rows={pageRows} />}
                {isLastPage && (
                  <TotalsBlock documento={documento} totals={totals} riepilogoTva={riepilogoTva} />
                )}
              </PageFrame>
            </ScaledPage>
          );
        })}
      </div>
    </>
  );
}
