import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  FilePenLine,
  Plus,
  ReceiptText,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { formatMoney } from "@/lib/format";
import ConfirmActionDialog from "./ConfirmActionDialog";
import { EmptyState, FatturaCards, FatturaTable, LoadingTable } from "./FatturaTable";
import { SummaryTile } from "./FatturaPills";
import FattureFilters from "./FattureFilters";
import InvoicePreviewDialog from "./InvoicePreviewDialog";
import { ALL_VALUE, compactParams } from "./fattureListHelpers";
import { useFatture } from "./useFatture";

const FILTRI_INIZIALI = {
  query: "",
  stato: ALL_VALUE,
  tipo: ALL_VALUE,
  boutiqueId: ALL_VALUE,
  dal: "",
  al: "",
};

export default function FattureListPage() {
  const navigate = useNavigate();
  const { utente } = useAuth();
  const ruolo = utente?.ruolo;
  const canFilterBoutique = ruolo === "ADMIN" || ruolo === "SUPER_ADMIN";

  const [filtri, setFiltri] = useState(FILTRI_INIZIALI);
  const [filtriOpen, setFiltriOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [pendingAction, setPendingAction] = useState(null);

  const filters = useMemo(() => compactParams({
    search: filtri.query.trim(),
    stato: filtri.stato,
    tipo: filtri.tipo,
    boutiqueId: filtri.boutiqueId,
    dal: filtri.dal,
    al: filtri.al,
  }), [filtri]);

  const hasFilters = Object.keys(filters).length > 0;

  const {
    fatture,
    pageInfo,
    boutiques,
    azienda,
    loading,
    workingId,
    apiError,
    feedback,
    loadFatture,
    eseguiAzione,
  } = useFatture({ filters, ruolo, canFilterBoutique });

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

  const updateFiltri = (patch) => setFiltri((current) => ({ ...current, ...patch }));
  const resetFilters = () => setFiltri(FILTRI_INIZIALI);

  const askAction = (type, fattura) => {
    setPendingAction({ type, fattura });
  };

  const closeAction = (open) => {
    if (!open && !workingId) setPendingAction(null);
  };

  const confirmAction = async () => {
    if (!pendingAction?.fattura) return;

    const { type, fattura } = pendingAction;
    const esito = await eseguiAzione(type, fattura, {
      mantieniAnteprima: preview?.id === fattura.id,
    });

    if (esito.ok) {
      setPendingAction(null);
      setPreview(esito.preview);
    }
  };

  const openEditor = (fattura) => navigate(`/fatture/${fattura.id}`);

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
            onClick={() => navigate("/fatture/nuova")}
            className="brand-primary h-9 rounded-xl font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nuova bozza
          </Button>
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

      <FattureFilters
        filtri={filtri}
        onChange={updateFiltri}
        onReset={resetFilters}
        filtriOpen={filtriOpen}
        onToggleOpen={() => setFiltriOpen((value) => !value)}
        hasFilters={hasFilters}
        activeCount={Object.keys(filters).length}
        boutiques={boutiques}
        canFilterBoutique={canFilterBoutique}
        pageLabel={`Pagina ${totalPages === 0 ? 0 : pageNumber + 1} di ${totalPages}`}
      />

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
            onEdit={openEditor}
            onAskAction={askAction}
          />
          <FatturaCards
            fatture={fatture}
            workingId={workingId}
            onPreview={setPreview}
            onEdit={openEditor}
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
