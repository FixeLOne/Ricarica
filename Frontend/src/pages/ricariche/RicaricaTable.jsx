import RicaricaRow from "./RicaricaRow";

const TH = ({ children, className = "" }) => (
  <th className={`px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-text)] ${className}`}>
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
    <div className="flex items-center justify-between border-t border-stone-200/70 bg-white px-4 py-3 dark:border-stone-800 dark:bg-stone-900">
      <span className="text-xs text-stone-400 dark:text-stone-500 tabular-nums">
        Pagina {page + 1} di {Math.max(1, totalPages)}
      </span>
      <div className="flex items-center gap-1">

        <button
          disabled={page === 0}
          onClick={() => onPageChange(page - 1)}
          aria-label="Pagina precedente"
          className={`${btn} ${page === 0 ? "text-stone-300 dark:text-stone-600 cursor-not-allowed" : "text-stone-500 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:text-stone-400 dark:hover:bg-[var(--brand-soft)] cursor-pointer"}`}
        >←</button>

        {totalPages > 1 && items.map((item, i) =>
          item === "ellipsis"
            ? <span key={`e-${i}`} className="text-xs text-stone-400 px-0.5">…</span>
            : (
              <button
                key={item}
                onClick={() => item !== page && onPageChange(item)}
                disabled={item === page}
                className={`${btn} ${item === page ? "brand-primary cursor-default" : "text-stone-500 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:text-stone-400 dark:hover:bg-[var(--brand-soft)] cursor-pointer"}`}
              >
                {item + 1}
              </button>
            )
        )}

        <button
          disabled={page >= totalPages - 1}
          onClick={() => onPageChange(page + 1)}
          aria-label="Pagina successiva"
          className={`${btn} ${page >= totalPages - 1 ? "text-stone-300 dark:text-stone-600 cursor-not-allowed" : "text-stone-500 hover:bg-[var(--brand-soft)] hover:text-[var(--brand-text)] dark:text-stone-400 dark:hover:bg-[var(--brand-soft)] cursor-pointer"}`}
        >→</button>

      </div>
    </div>
  );
}

export default function RicaricaTable({
  ricariche, loading, isAdmin,
  flashId, editedIds,
  onModifica, onElimina,
  page, totalPages, onPageChange,
}) {
  const colSpan = isAdmin ? 9 : 7;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-stone-200/80 bg-white shadow-[0_18px_45px_-38px_var(--brand-shadow)] dark:border-stone-800 dark:bg-stone-900">

      <div className="relative flex-1 overflow-auto">
        <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10 bg-gradient-to-l from-white to-transparent lg:hidden dark:from-stone-900" />
        <table className="w-full min-w-[860px] table-fixed">
          <colgroup>
            <col className="w-16" />
            <col className="w-32" />
            <col className="w-24" />
            <col className="w-16" />
            {isAdmin ? (
              <>
                <col className="w-36" />
                <col className="w-24" />
                <col className="w-24" />
                <col className="w-28" />
              </>
            ) : (
              <>
                <col className="w-40" />
                <col className="w-24" />
              </>
            )}
            <col className="w-20" />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--brand-border)] bg-[var(--brand-soft)]">
              <TH>Ora</TH>
              <TH>Numero</TH>
              <TH>Operatore</TH>
              <TH>Giga</TH>
              <TH>Note</TH>
              {isAdmin ? (
                <>
                  <TH>Prezzo</TH>
                  <TH>Profitto</TH>
                  <TH>Boutique</TH>
                </>
              ) : (
                <TH>Prezzo</TH>
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
                deleted={r.eliminato}
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
