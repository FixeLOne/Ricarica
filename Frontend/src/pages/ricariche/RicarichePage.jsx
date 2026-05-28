import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import useRicariche from "@/hooks/useRicariche";
import RicaricaForm from "./RicaricaForm";
import RicaricaTable from "./RicaricaTable";
import StatsPanel from "./StatsPanel";
import ModificaRicaricaModal, { ConfirmDialog } from "./ModificaRicaricaModal";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const ALL_BOUTIQUES_VALUE = "__ALL__";

function Orologio() {
  const [ora, setOra] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setOra(new Date()), 60000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
      {ora.toLocaleString("it-IT", { weekday: "short", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
    </span>
  );
}

export default function RicarichePage() {
  const {
    ruolo, isAdmin,
    ricariche, totalPages, page,
    countN, stats, tariffe, boutiques, boutiqueName, vistaBoutiqueId,
    loading, apiError, setApiError,
    flashId, editedIds,
    submitting, submitMod, formKey,
    caricaRicariche, handleCrea, handleModifica, handleElimina, handleVistaBoutiqueChange,
  } = useRicariche();

  const [modificaRiga, setModificaRiga] = useState(null);
  const [confirmRiga,  setConfirmRiga]  = useState(null);
  const boutiquesOperative = boutiques.filter((boutique) =>
    boutique.attiva !== false && boutique.ricaricheAbilitate !== false
  );
  const boutiqueCorrente = !isAdmin && boutiques.length > 0 ? boutiques[0] : null;
  const puoCreareRicarica = isAdmin
    ? boutiquesOperative.length > 0
    : !boutiqueCorrente || (boutiqueCorrente.attiva !== false && boutiqueCorrente.ricaricheAbilitate !== false);
  const bloccoRicarica = boutiqueCorrente?.attiva === false
    ? "Boutique disattivata: non puoi inserire nuove ricariche."
    : boutiqueCorrente?.ricaricheAbilitate === false
      ? "Ricariche spente per questa boutique."
      : "Nessuna boutique operativa con ricariche attive.";

  const onModificaSubmit = async (formData) => {
    const ok = await handleModifica(formData, modificaRiga.id);
    if (ok) setModificaRiga(null);
  };

  const onEliminaConfirm = async () => {
    await handleElimina(confirmRiga.id);
    setConfirmRiga(null);
  };

  const cardCn = "overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_18px_45px_-38px_var(--brand-shadow)] dark:border-stone-800 dark:bg-stone-900";
  const cardHeaderCn = "border-b border-[var(--brand-border)] bg-[var(--brand-soft)] px-5 py-3";
  const cardHeaderTextCn = "text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-text)]";

  return (
    <>
    {/* Toast errore — floating, non sposta il layout */}
    <AnimatePresence>
      {apiError && (
        <motion.div
          key="api-error-toast"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg bg-red-600 text-white text-sm font-medium max-w-sm w-max"
        >
          <span>{apiError}</span>
          <button type="button" onClick={() => setApiError(null)} className="shrink-0 cursor-pointer opacity-80 hover:opacity-100">
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
    <div className="flex h-full min-h-0 flex-col gap-5">

      {/* ── Header pagina ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
            <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_0_4px_var(--brand-soft)]" />
            Ricariche{boutiqueName ? ` — ${boutiqueName}` : ""}
          </h1>
          <Orologio />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && boutiques.length > 0 && (
            <div className="flex items-center gap-2">
              <Label className="text-[10px] font-semibold uppercase tracking-widest text-stone-500 dark:text-stone-400">
                Vista boutique
              </Label>
              <Select
                value={vistaBoutiqueId || ALL_BOUTIQUES_VALUE}
                onValueChange={(value) => handleVistaBoutiqueChange(value === ALL_BOUTIQUES_VALUE ? "" : value)}
              >
                <SelectTrigger className="h-9 w-[180px] rounded-xl border-stone-200 bg-white text-stone-800 shadow-sm dark:border-stone-800 dark:bg-stone-900 dark:text-stone-100 sm:w-[220px]">
                  <SelectValue placeholder="Tutte" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_BOUTIQUES_VALUE}>Tutte</SelectItem>
                  {boutiques.map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.nome}
                      {b.attiva === false ? " · disattivata" : ""}
                      {b.ricaricheAbilitate === false ? " · ricariche spente" : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {isAdmin && countN !== null && (
            <div className="brand-soft flex items-center gap-1.5 rounded-full border px-3 py-1 shadow-sm">
              <span className="text-lg font-bold tabular-nums leading-none">{countN}</span>
              <span className="text-[10px] font-medium uppercase tracking-wide opacity-75">oggi</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Layout split: form sx + tabella dx ── */}
      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-5 lg:flex-row">

        {/* Colonna sinistra — form inserimento */}
        <div className={`w-full lg:w-[460px] shrink-0 self-start ${cardCn}`}>
          <div className={cardHeaderCn}>
            <p className={cardHeaderTextCn}>Nuova ricarica</p>
          </div>
          <div className="p-5">
            {puoCreareRicarica ? (
              <RicaricaForm
                key={formKey}
                onSubmit={handleCrea}
                tariffe={tariffe}
                boutiques={boutiquesOperative}
                ruolo={ruolo}
                isSubmitting={submitting}
                submitLabel="Aggiungi"
              />
            ) : (
              <div className="flex min-h-[260px] flex-col justify-between rounded-2xl border border-[var(--brand-border)] bg-[var(--brand-soft)] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--brand-text)] shadow-sm dark:bg-stone-900/60">
                    <AlertTriangle className="h-5 w-5" />
                  </span>
                  <div>
                    <h2 className="text-sm font-semibold text-stone-950 dark:text-stone-50">
                      Ricariche non disponibili
                    </h2>
                    <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                      {bloccoRicarica}
                    </p>
                  </div>
                </div>
                {isAdmin && (
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    Riattiva il servizio dalla pagina Boutique per tornare a creare ricariche.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Colonna centrale — tabella ricariche */}
        <div className="min-h-0 flex-1 min-w-0">
          <RicaricaTable
            ricariche={ricariche} loading={loading} isAdmin={isAdmin}
            flashId={flashId} editedIds={editedIds}
            onModifica={setModificaRiga} onElimina={setConfirmRiga}
            page={page} totalPages={totalPages} onPageChange={caricaRicariche}
          />
        </div>

        {/* Colonna destra — stats (solo dipendente) */}
        {!isAdmin && <StatsPanel stats={stats} />}
      </div>

      <ModificaRicaricaModal
        riga={modificaRiga} tariffe={tariffe} boutiques={boutiques}
        ruolo={ruolo} isSubmitting={submitMod}
        onSubmit={onModificaSubmit} onClose={() => setModificaRiga(null)}
      />

      <ConfirmDialog
        open={!!confirmRiga} numero={confirmRiga?.numero}
        onConfirm={onEliminaConfirm} onCancel={() => setConfirmRiga(null)}
      />
    </div>
    </>
  );
}
