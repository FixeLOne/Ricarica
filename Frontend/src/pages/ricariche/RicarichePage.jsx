import { useEffect, useState } from "react";
import useRicariche from "@/hooks/useRicariche";
import RicaricaForm from "./RicaricaForm";
import RicaricaTable from "./RicaricaTable";
import UltimeRicariche from "./UltimeRicariche";
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

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Ricariche{boutiqueName ? ` — ${boutiqueName}` : ""}
          </h1>
          <Orologio />
        </div>
        {countN !== null && (
          <div className="text-right">
            <p className="text-2xl font-bold text-amber-500 dark:text-amber-400 tabular-nums leading-none">{countN}</p>
            <p className="text-[10px] text-stone-400 dark:text-stone-500 mt-0.5 uppercase tracking-wide">oggi</p>
          </div>
        )}
      </div>

      {apiError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      {/* ── Form + Ultime (2 col su lg+) ── */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-4">

        {/* Colonna sinistra: form inserimento */}
        <div className="flex-1 min-w-0 bg-white dark:bg-stone-800 rounded-xl border border-stone-200 dark:border-stone-700 p-5 shadow-sm">
          <p className="text-[11px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest mb-4">
            Nuova ricarica
          </p>
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

        {/* Colonna destra: ultime ricariche — solo lg+ */}
        <div className="hidden lg:block w-[320px] shrink-0">
          <UltimeRicariche
            ricariche={ricariche}
            flashId={flashId}
            loading={loading}
          />
        </div>
      </div>

      {/* ── Tabella ── */}
      <RicaricaTable
        ricariche={ricariche} loading={loading} isAdmin={isAdmin}
        flashId={flashId} editedIds={editedIds} deletedIds={deletedIds}
        onModifica={setModificaRiga} onElimina={setConfirmRiga}
        page={page} totalPages={totalPages} onPageChange={caricaRicariche}
      />

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
