import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import useRicariche from "@/hooks/useRicariche";
import RicaricaForm from "./RicaricaForm";
import RicaricaTable from "./RicaricaTable";
import StatsPanel from "./StatsPanel";
import ModificaRicaricaModal, { ConfirmDialog } from "./ModificaRicaricaModal";

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
    countN, stats, tariffe, boutiques, boutiqueName,
    loading, apiError, setApiError,
    flashId, editedIds,
    submitting, submitMod, formKey,
    caricaRicariche, handleCrea, handleModifica, handleElimina, handleBoutiqueChange,
  } = useRicariche();

  const [modificaRiga, setModificaRiga] = useState(null);
  const [confirmRiga,  setConfirmRiga]  = useState(null);

  const onModificaSubmit = async (formData) => {
    const ok = await handleModifica(formData, modificaRiga.id);
    if (ok) setModificaRiga(null);
  };

  const onEliminaConfirm = async () => {
    await handleElimina(confirmRiga.id);
    setConfirmRiga(null);
  };

  const cardCn = "bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden";
  const cardHeaderCn = "px-5 py-3 border-b border-stone-100 dark:border-stone-700/60 bg-stone-50/60 dark:bg-stone-900/30";
  const cardHeaderTextCn = "text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest";

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
    <div className="space-y-4 pb-6">

      {/* ── Header pagina ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Ricariche{boutiqueName ? ` — ${boutiqueName}` : ""}
          </h1>
          <Orologio />
        </div>
        {isAdmin && countN !== null && (
          <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 rounded-full px-3 py-1">
            <span className="text-lg font-bold text-amber-500 dark:text-amber-400 tabular-nums leading-none">{countN}</span>
            <span className="text-[10px] text-amber-500/70 dark:text-amber-400/70 uppercase tracking-wide font-medium">oggi</span>
          </div>
        )}
      </div>

      {/* ── Layout split: form sx + tabella dx ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-stretch" style={{ height: "calc(100vh - 11rem)" }}>

        {/* Colonna sinistra — form inserimento */}
        <div className={`w-full lg:w-[460px] shrink-0 self-start ${cardCn}`}>
          <div className={cardHeaderCn}>
            <p className={cardHeaderTextCn}>Nuova ricarica</p>
          </div>
            <div className="p-5">
            <RicaricaForm
              key={formKey}
              onSubmit={handleCrea}
              onBoutiqueChange={handleBoutiqueChange}
              tariffe={tariffe}
              boutiques={boutiques}
              ruolo={ruolo}
              isSubmitting={submitting}
              submitLabel="Aggiungi"
            />
          </div>
        </div>

        {/* Colonna centrale — tabella ricariche */}
        <div className="flex-1 min-w-0">
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
