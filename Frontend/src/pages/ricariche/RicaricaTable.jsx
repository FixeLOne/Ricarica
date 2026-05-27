import RicaricaRow from "./RicaricaRow";

const TH = ({ children, className = "" }) => (
  <th className={`py-3 px-4 text-left text-[10px] font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-widest ${className}`}>
    {children}
  </th>
);

// Sempre visibile — footer strutturale della tabella
function Paginazione({ page, totalPages, onPageChange }) {
  const btn = "min-w-[30px] h-7 px-1.5 rounded-lg text-xs font-medium transition-colors";

  const set = new Set([0, totalPages - 1]);
  for (let i = Math.max(0, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) set.add(i);
  const sorted = [...set].sort((a, b) => a - b);

  const items = [];
  let prev = -1;
  for (const p of sorted) {
    if (prev !== -1 && p - prev > 1) items.push("ellipsis");
    items.push(p);
    prev = p;
  }

  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-stone-100 dark:border-stone-700/60 mt-auto">
      <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
        Pagina {page + 1} di {Math.max(1, totalPages)}
      </span>
      <div className="flex items-center gap-1">

        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Pagina precedente"
          className={`${btn} ${page === 0 ? "text-stone-300 dark:text-stone-600 cursor-not-allowed" : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"}`}
        >←</button>

        {totalPages > 1 && items.map((item, i) =>
          item === "ellipsis"
            ? <span key={`e-${i}`} className="text-xs text-stone-400 px-0.5">…</span>
            : (
              <button
                key={item}
                onClick={() => item !== page && onPageChange(item)}
                disabled={item === page}
                className={`${btn} ${item === page ? "bg-amber-500 text-white cursor-default" : "text-stone-500 dark:text-stone-400 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"}`}
              >
                {item + 1}
              </button>
            )
        )}

        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Pagina successiva"
          className={`${btn} ${page >= totalPages - 1 ? "text-stone-300 dark:text-stone-600 cursor-not-allowed" : "text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer"}`}
        >→</button>

      </div>
    </div>
  );
}

export default function RicaricaTable({
  ricariche, loading, isAdmin,
  flashId, editedIds, deletedIds,
  onModifica, onElimina,
  page, totalPages, onPageChange,
}) {
  const colSpan = isAdmin ? 9 : 6;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-sm overflow-hidden">

      <div className="flex-1 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-stone-100 dark:border-stone-700/60 bg-stone-50/60 dark:bg-stone-900/30">
              <TH>Ora</TH>
              <TH>Numero</TH>
              <TH>Operatore</TH>
              <TH>Giga</TH>
              <TH>Note</TH>
              {isAdmin && (
                <>
                  <TH>Prezzo</TH>
                  <TH>Profitto</TH>
                  <TH>Boutique</TH>
                </>
              )}
              <TH className="text-right">Azioni</TH>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={colSpan} className="py-16 text-center text-sm text-stone-400 dark:text-stone-500">
                  Caricamento…
                </td>
              </tr>
            ) : ricariche.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="py-16 text-center text-sm text-stone-400 dark:text-stone-500">
                  Nessuna ricarica ancora oggi.
                </td>
              </tr>
            ) : ricariche.map(r => (
              <RicaricaRow
                key={r.id} riga={r} isAdmin={isAdmin}
                flash={flashId === r.id}
                edited={editedIds.has(r.id)}
                deleted={deletedIds.has(r.id)}
                onModifica={onModifica}
                onElimina={onElimina}
              />
            ))}
          </tbody>
        </table>
      </div>

      <Paginazione page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </div>
  );
}
