import { useState } from "react";
import { Plus, Pencil, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import useTariffe from "@/hooks/useTariffe";
import TariffaModal from "./TariffaModal";

// ─── Costanti ─────────────────────────────────────────────────────────────────

const FILTRI = ["Tutti", "Ooredoo", "Orange", "Telecom", "Fisso", "Default"];

const BADGE = {
  OOREDOO: { label: "Ooredoo", cn: "bg-red-50 dark:bg-red-900/20 text-[#E30613] dark:text-[#ff4d57] border-red-200 dark:border-red-800/40" },
  ORANGE:  { label: "Orange",  cn: "bg-orange-50 dark:bg-orange-900/20 text-[#FF6600] dark:text-[#ff8533] border-orange-200 dark:border-orange-800/40" },
  TELECOM: { label: "Telecom", cn: "bg-blue-50 dark:bg-blue-900/20 text-[#003DA5] dark:text-[#4d80d4] border-blue-200 dark:border-blue-800/40" },
  FISSO:   { label: "Fisso",   cn: "bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40" },
  DEFAULT: { label: "Default", cn: "bg-stone-100 dark:bg-stone-700 text-stone-500 dark:text-stone-400 border-stone-200 dark:border-stone-600" },
};

function OperatoreBadge({ operatore }) {
  const key = operatore?.toUpperCase() ?? "DEFAULT";
  const b   = BADGE[key] ?? BADGE.DEFAULT;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-semibold ${b.cn}`}>
      {b.label}
    </span>
  );
}

const TH = ({ children, className = "" }) => (
  <th className={`py-3 px-4 text-left text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${className}`}>
    {children}
  </th>
);

// ─── Pagina ───────────────────────────────────────────────────────────────────

export default function TariffePage() {
  const { tariffe, loading, apiError, handleCrea, handleModifica, handleElimina } = useTariffe();

  const [filtro,           setFiltro]           = useState("Tutti");
  const [gruppiCollassati, setGruppiCollassati] = useState(new Set());

  const toggleGruppo = (label) => setGruppiCollassati(prev => {
    const next = new Set(prev);
    next.has(label) ? next.delete(label) : next.add(label);
    return next;
  });
  const [modalAperto,  setModalAperto]  = useState(false);
  const [rigaModifica, setRigaModifica] = useState(null);
  const [submitting,   setSubmitting]   = useState(false);
  const [modalError,   setModalError]   = useState(null);
  const [confirmId,    setConfirmId]    = useState(null);

  // Filtro frontend
  const tariffeFiltrate = tariffe.filter(t => {
    if (filtro === "Tutti") return true;
    if (filtro === "Default") return !t.operatore;
    return t.operatore?.toUpperCase() === filtro.toUpperCase();
  });

  // Raggruppamento per "Tutti" — ordine fisso, righe con separatore intestazione
  const ORDINE_GRUPPI = ["OOREDOO", "ORANGE", "TELECOM", "FISSO", null];

  const righeTabella = filtro !== "Tutti"
    ? tariffeFiltrate   // chip specifico → lista piatta senza separatori
    : ORDINE_GRUPPI.flatMap(op => {
        const gruppo = tariffeFiltrate.filter(t =>
          op === null ? !t.operatore : t.operatore?.toUpperCase() === op
        );
        if (gruppo.length === 0) return [];
        const label = op ? (BADGE[op]?.label ?? op) : "Default";
        return [{ __separatore: true, label }, ...gruppo.map(t => ({ ...t, __gruppo: label }))];
      });

  const apriModifica = (t) => { setRigaModifica(t); setModalAperto(true); setModalError(null); };
  const apriCrea     = ()  => { setRigaModifica(null); setModalAperto(true); setModalError(null); };
  const chiudiModal  = ()  => { setModalAperto(false); setRigaModifica(null); setModalError(null); };

  const onSave = async (formData) => {
    setSubmitting(true);
    setModalError(null);
    const err = rigaModifica
      ? await handleModifica(rigaModifica.id, formData)
      : await handleCrea(formData);
    setSubmitting(false);
    if (err) { setModalError(err); return; }
    chiudiModal();
  };

  const onEliminaConfirm = async () => {
    if (!confirmId) return;
    await handleElimina(confirmId);
    setConfirmId(null);
  };

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-stone-900 dark:text-stone-50">Tariffe</h1>
        <Button
          onClick={apriCrea}
          className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-400 dark:hover:bg-amber-500 dark:text-stone-900 text-white h-9 rounded-lg font-semibold gap-1.5"
        >
          <Plus className="w-4 h-4" />
          Aggiungi tariffa
        </Button>
      </div>

      {/* ── Filtri chip ── */}
      <div className="flex flex-wrap gap-2">
        {FILTRI.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={[
              "px-3 py-1 rounded-full text-xs font-medium transition-all duration-150 cursor-pointer select-none",
              filtro === f
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:border-amber-400/60 hover:text-stone-700 dark:hover:text-stone-200",
            ].join(" ")}
          >
            {f}
          </button>
        ))}
      </div>

      {apiError && (
        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
          {apiError}
        </p>
      )}

      {/* ── Tabella ── */}
      <div className="bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stone-100 dark:border-stone-700/60 bg-stone-50/60 dark:bg-stone-900/30">
                <TH>Operatore</TH>
                <TH>Giga</TH>
                <TH>Costo acquisto</TH>
                <TH>Prezzo cliente</TH>
                <TH className="text-right">Azioni</TH>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-stone-400 dark:text-stone-500">
                    Caricamento…
                  </td>
                </tr>
              ) : righeTabella.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-sm text-stone-400 dark:text-stone-500">
                    Nessuna tariffa{filtro !== "Tutti" ? ` per "${filtro}"` : ""}.
                  </td>
                </tr>
              ) : righeTabella.map((item, idx) =>
                item.__separatore ? (
                  // ── Separatore gruppo collassabile ──
                  <tr key={`sep-${item.label}`}>
                    <td colSpan={5} className="px-4 pt-5 pb-1.5">
                      <button
                        type="button"
                        onClick={() => toggleGruppo(item.label)}
                        className="flex items-center gap-3 w-full group cursor-pointer"
                      >
                        <ChevronRight
                          className={`w-3 h-3 text-stone-400 dark:text-stone-500 shrink-0 transition-transform duration-150 ${gruppiCollassati.has(item.label) ? "" : "rotate-90"}`}
                        />
                        <span className="text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest whitespace-nowrap">
                          {item.label}
                        </span>
                        <span className="flex-1 h-px bg-stone-100 dark:bg-stone-700/60" />
                      </button>
                    </td>
                  </tr>
                ) : gruppiCollassati.has(item.__gruppo) ? null : (
                  // ── Riga tariffa ──
                  <tr
                    key={item.id}
                    className="border-b border-stone-50 dark:border-stone-700/40 hover:bg-stone-50/80 dark:hover:bg-stone-700/30 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <OperatoreBadge operatore={item.operatore} />
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-stone-700 dark:text-stone-200 tabular-nums">
                      {parseFloat(item.giga)} GB
                    </td>
                    <td className="py-3 px-4 text-sm text-stone-600 dark:text-stone-300 tabular-nums">
                      {parseFloat(item.costoAcquisto).toFixed(3)} DT
                    </td>
                    <td className="py-3 px-4 text-sm font-medium text-stone-700 dark:text-stone-200 tabular-nums">
                      {parseFloat(item.prezzoVendita).toFixed(3)} DT
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          onClick={() => apriModifica(item)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                          aria-label="Modifica"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmId(item.id)}
                          className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                          aria-label="Elimina"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal creazione / modifica ── */}
      {modalAperto && (
        <TariffaModal
          tariffa={rigaModifica}
          onSave={onSave}
          onClose={chiudiModal}
          isSubmitting={submitting}
          serverError={modalError}
        />
      )}

      {/* ── Confirm elimina ── */}
      {confirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="w-full max-w-sm bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-sm font-semibold text-stone-900 dark:text-stone-50">Elimina tariffa</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Vuoi eliminare questa tariffa? L'operazione non è reversibile.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setConfirmId(null)}
                className="border-stone-200 dark:border-stone-700 text-stone-700 dark:text-stone-300 h-9 rounded-lg"
              >
                Annulla
              </Button>
              <Button
                onClick={onEliminaConfirm}
                className="bg-red-500 hover:bg-red-600 text-white h-9 rounded-lg font-semibold"
              >
                Elimina
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
