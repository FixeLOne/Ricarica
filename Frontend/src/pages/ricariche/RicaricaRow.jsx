import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pencil, Trash2 } from "lucide-react";
import { COLORI_OPERATORE, formatOra, formatDataOra } from "@/lib/operatori";

const DOT_COLORS = {
  OOREDOO: "#E30613",
  ORANGE:  "#FF6600",
  TELECOM: "#003DA5",
  FISSO:   "#0891b2",
};

function OperatoreCell({ operatore }) {
  if (!operatore) return <span className="text-xs text-stone-300 dark:text-stone-700">—</span>;
  const op = operatore.toUpperCase();
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className="w-2 h-2 rounded-full shrink-0"
        style={{ backgroundColor: DOT_COLORS[op] ?? "#a8a29e" }}
      />
      <span className="text-xs text-stone-600 dark:text-stone-300 font-medium">
        {op.charAt(0) + op.slice(1).toLowerCase()}
      </span>
    </span>
  );
}

export default function RicaricaRow({ riga, isAdmin, onModifica, onElimina, flash, edited, deleted }) {
  const [espansa, setEspansa] = useState(false);
  const colSpan = isAdmin ? 9 : 6;

  const rowCn = [
    "border-b border-stone-100 dark:border-stone-800 last:border-b-0 cursor-pointer transition-colors",
    deleted
      ? "bg-red-50 dark:bg-red-900/10 hover:bg-red-100/60 dark:hover:bg-red-900/20"
      : edited
        ? "border-l-2 border-l-blue-400 hover:bg-stone-50 dark:hover:bg-stone-800/50"
        : "hover:bg-stone-50/80 dark:hover:bg-stone-700/30",
  ].join(" ");

  return (
    <>
      <motion.tr
        initial={flash ? { backgroundColor: "rgba(34,197,94,0.25)" } : false}
        animate={{ backgroundColor: "rgba(0,0,0,0)" }}
        transition={{ duration: 1.2, ease: "easeOut" }}
        onClick={() => setEspansa(v => !v)}
        className={rowCn}
      >
        {/* Ora */}
        <td className="py-3 px-2 whitespace-nowrap">
          <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
            {formatOra(riga.dataOra)}
          </span>
        </td>

        {/* Numero */}
        <td className="py-3 px-3 whitespace-nowrap">
          <span className={`text-sm font-mono ${deleted ? "line-through text-red-400 dark:text-red-500" : "text-stone-800 dark:text-stone-100"}`}>
            {riga.numero}
          </span>
          {deleted && (
            <span className="ml-1.5 inline-flex items-center rounded bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-[10px] px-1.5 py-0.5 font-semibold tracking-wide">
              ELIM.
            </span>
          )}
          {edited && !deleted && (
            <span className="ml-1.5 inline-flex items-center rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] px-1.5 py-0.5 font-semibold tracking-wide">
              MOD
            </span>
          )}
        </td>

        {/* Operatore */}
        <td className="py-3 px-3">
          <OperatoreCell operatore={riga.operatore} />
        </td>

        {/* Giga */}
        <td className="py-3 px-3 text-sm font-medium text-stone-700 dark:text-stone-200 tabular-nums">
          {parseFloat(riga.giga)} GB
        </td>

        {/* Note */}
        <td className="py-3 px-3 text-xs max-w-[160px]">
          {riga.note
            ? <span title={riga.note} className="truncate block text-stone-500 dark:text-stone-400">
                {riga.note.length > 30 ? riga.note.slice(0, 30) + "…" : riga.note}
              </span>
            : <span className="text-stone-200 dark:text-stone-700">—</span>
          }
        </td>

        {/* Prezzo — sempre visibile */}
        {!isAdmin && (
          <td className="py-3 px-3 text-sm text-stone-600 dark:text-stone-300 tabular-nums">
            {parseFloat(riga.costoCliente).toFixed(3)} DT
          </td>
        )}

        {/* Colonne admin */}
        {isAdmin && (
          <>
            <td className="py-3 px-3 text-sm text-stone-600 dark:text-stone-300 tabular-nums">
              {parseFloat(riga.costoCliente).toFixed(3)} DT
            </td>
            <td className="py-3 px-3 text-sm tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
              {parseFloat(riga.profitto).toFixed(3)} DT
            </td>
            <td className="py-3 px-3 text-xs text-stone-500 dark:text-stone-400 max-w-[120px] truncate">
              {riga.boutiqueNome ?? "—"}
            </td>
          </>
        )}

        {/* Azioni */}
        <td className="py-3 px-3 text-right whitespace-nowrap" onClick={e => e.stopPropagation()}>
          {!deleted && (
            <div className="inline-flex items-center gap-0.5">
              <button
                onClick={() => onModifica(riga)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors cursor-pointer"
                aria-label="Modifica"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onElimina(riga)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                aria-label="Elimina"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </td>
      </motion.tr>

      {/* Dettaglio espanso */}
      <AnimatePresence initial={false}>
        {espansa && (
          <motion.tr
            key="detail"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <td
              colSpan={colSpan}
              className="px-8 py-3 bg-stone-50 dark:bg-stone-900/30 border-b border-stone-100 dark:border-stone-800"
            >
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-2 text-xs">
                <div>
                  <p className="text-stone-400 dark:text-stone-500 mb-0.5">Data e ora</p>
                  <p className="text-stone-700 dark:text-stone-200 font-medium">{formatDataOra(riga.dataOra)}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-stone-400 dark:text-stone-500 mb-0.5">Costo effettivo</p>
                    <p className="text-stone-700 dark:text-stone-200 font-medium">{parseFloat(riga.costoEffettivo).toFixed(3)} DT</p>
                  </div>
                )}
                <div>
                  <p className="text-stone-400 dark:text-stone-500 mb-0.5">Prezzo cliente</p>
                  <p className="text-stone-700 dark:text-stone-200 font-medium">{parseFloat(riga.costoCliente).toFixed(3)} DT</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-stone-400 dark:text-stone-500 mb-0.5">Profitto</p>
                    <p className="font-medium text-emerald-600 dark:text-emerald-400">{parseFloat(riga.profitto).toFixed(3)} DT</p>
                  </div>
                )}
                {riga.note && (
                  <div className="col-span-2 sm:col-span-4">
                    <p className="text-stone-400 dark:text-stone-500 mb-0.5">Note</p>
                    <p className="text-stone-700 dark:text-stone-200">{riga.note}</p>
                  </div>
                )}
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
}
