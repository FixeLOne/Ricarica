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
  <th className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-text)] ${className}`}>
    {children}
  </th>
);

// ─── Pagina ───────────────────────────────────────────────────────────────────

function calcolaMargine(tariffa) {
  return Number(tariffa.prezzoVendita ?? 0) - Number(tariffa.costoAcquisto ?? 0);
}

function MargineCell({ tariffa }) {
  const margine = calcolaMargine(tariffa);
  const prezzo = Number(tariffa.prezzoVendita ?? 0);
  const pct = prezzo > 0 ? (margine / prezzo) * 100 : 0;
  const basso = margine <= 0 || pct < 8;

  return (
    <td className="px-4 py-3">
      <div className="flex flex-col items-start gap-0.5">
        <span className={`text-sm font-semibold tabular-nums ${basso ? "text-red-600 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
          {margine.toFixed(3)} DT
        </span>
        <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums ${basso ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300" : "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
    </td>
  );
}

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
    <div className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <h1 className="flex items-center gap-2 text-xl font-semibold tracking-tight text-stone-950 dark:text-stone-50">
          <span className="h-2 w-2 rounded-full bg-[var(--brand-primary)] shadow-[0_0_0_4px_var(--brand-soft)]" />
          Tariffe
        </h1>
        <Button
          onClick={apriCrea}
          className="brand-primary h-9 rounded-xl font-semibold gap-1.5"
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
              "rounded-full px-3 py-1 text-xs font-medium transition-all duration-150 cursor-pointer select-none",
              filtro === f
                ? "brand-primary"
                : "border border-stone-200 bg-white text-stone-500 hover:border-[var(--brand-border)] hover:bg-[var(--brand-soft)] hover:text-stone-800 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-[var(--brand-border)] dark:hover:bg-[var(--brand-soft)] dark:hover:text-stone-200",
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
      <div className="overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_18px_45px_-38px_var(--brand-shadow)] dark:border-stone-800 dark:bg-stone-900">
        <div className="relative overflow-x-auto">
          <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent lg:hidden dark:from-stone-900" />
          <table className="w-full min-w-[920px]">
            <thead>
              <tr className="border-b border-[var(--brand-border)] bg-[var(--brand-soft)]">
                <TH>Operatore</TH>
                <TH>Giga</TH>
                <TH>Costo acquisto</TH>
                <TH>Prezzo cliente</TH>
                <TH>Margine</TH>
                <TH className="text-right">Azioni</TH>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-stone-400 dark:text-stone-500">
                    Caricamento…
                  </td>
                </tr>
              ) : righeTabella.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-sm text-stone-400 dark:text-stone-500">
                    Nessuna tariffa{filtro !== "Tutti" ? ` per "${filtro}"` : ""}.
                  </td>
                </tr>
              ) : righeTabella.map((item) =>
                item.__separatore ? (
                  // ── Separatore gruppo collassabile ──
                  <tr key={`sep-${item.label}`}>
                    <td colSpan={6} className="px-4 pt-5 pb-1.5">
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
                        <span className="flex-1 h-px bg-[var(--brand-border)]" />
                      </button>
                    </td>
                  </tr>
                ) : gruppiCollassati.has(item.__gruppo) ? null : (
                  // ── Riga tariffa ──
                  <tr
                    key={item.id}
                    className="border-b border-stone-100 transition-colors hover:bg-[var(--brand-soft)] dark:border-stone-800/70"
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
                    <MargineCell tariffa={item} />
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-0.5">
                        <button
                          onClick={() => apriModifica(item)}
                          className="rounded-lg p-1.5 text-stone-400 transition-colors cursor-pointer hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:hover:bg-[var(--brand-soft)]"
                          aria-label="Modifica"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setConfirmId(item.id)}
                          className="rounded-lg p-1.5 text-stone-400 transition-colors cursor-pointer hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-300"
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/35 backdrop-blur-[2px]"
          onClick={() => setConfirmId(null)}
        >
          <div
            className="w-full max-w-sm space-y-4 rounded-xl border border-stone-200 bg-white p-5 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.55)] dark:border-stone-800 dark:bg-stone-900"
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
                className="h-9 rounded-xl border-stone-200 text-stone-700 dark:border-stone-800 dark:text-stone-300"
              >
                Annulla
              </Button>
              <Button
                onClick={onEliminaConfirm}
                className="h-9 rounded-xl bg-red-500 font-semibold text-white hover:bg-red-600"
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
