import { useEffect, useState } from "react";
import useRicariche from "@/hooks/useRicariche";
import RicaricaForm from "./RicaricaForm";
import RicaricaTable from "./RicaricaTable";
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
    countN, tariffe, boutiques, boutiqueName,
    loading, apiError,
    flashId, editedIds, deletedIds,
    submitting, submitMod, formKey,
    caricaRicariche, handleCrea, handleModifica, handleElimina,
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
    <div className="space-y-4">

      {/* ── Header pagina ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2.5">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Ricariche{boutiqueName ? ` — ${boutiqueName}` : ""}
          </h1>
          <Orologio />
        </div>
        {countN !== null && (
          <div className="flex items-center gap-1.5 bg-amber-500/10 dark:bg-amber-400/10 border border-amber-500/20 dark:border-amber-400/20 rounded-full px-3 py-1">
            <span className="text-lg font-bold text-amber-500 dark:text-amber-400 tabular-nums leading-none">{countN}</span>
            <span className="text-[10px] text-amber-500/70 dark:text-amber-400/70 uppercase tracking-wide font-medium">oggi</span>
          </div>
        )}
      </div>

      {apiError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      {/* ── Layout split: form sx + tabella dx ── */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">

        {/* Colonna sinistra — form inserimento */}
        <div className={`w-full lg:w-[400px] shrink-0 ${cardCn}`}>
          <div className={cardHeaderCn}>
            <p className={cardHeaderTextCn}>Nuova ricarica</p>
          </div>
          <div className="p-5">
            <RicaricaForm
              key={formKey}
              onSubmit={handleCrea}
              tariffe={tariffe}
              boutiques={boutiques}
              ruolo={ruolo}
              isSubmitting={submitting}
              submitLabel="Aggiungi"
            />
          </div>
        </div>

        {/* Colonna destra — tabella ricariche */}
        <div className="flex-1 min-w-0">
          <RicaricaTable
            ricariche={ricariche} loading={loading} isAdmin={isAdmin}
            flashId={flashId} editedIds={editedIds} deletedIds={deletedIds}
            onModifica={setModificaRiga} onElimina={setConfirmRiga}
            page={page} totalPages={totalPages} onPageChange={caricaRicariche}
          />
        </div>
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
  );
}
