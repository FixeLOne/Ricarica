// Formattazione condivisa di numeri, importi (DT, 3 decimali) e date.

export function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function formatMoney(value) {
  return `${toNumber(value).toLocaleString("it-IT", {
    minimumFractionDigits: 3,
    maximumFractionDigits: 3,
  })} DT`;
}

export function formatPercent(value) {
  return `${toNumber(value).toLocaleString("it-IT", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}%`;
}

export function formatDate(value) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Data e ora di un salvataggio.
 *
 * Per i documenti toccati di recente conta l'ora, non il giorno: "oggi 14:32"
 * si legge piu in fretta di "19 ago 2026, 14:32" e distingue subito quello su
 * cui si sta lavorando da quello archiviato la settimana scorsa.
 */
export function formatDateTime(value) {
  if (!value) return "-";
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "-";

  const ora = new Intl.DateTimeFormat("it-IT", { hour: "2-digit", minute: "2-digit" }).format(data);
  const giorni = giorniDiDistanza(data, new Date());

  if (giorni === 0) return `oggi ${ora}`;
  if (giorni === 1) return `ieri ${ora}`;
  return `${formatDate(value)}, ${ora}`;
}

function giorniDiDistanza(data, riferimento) {
  const giorno = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.round((giorno(riferimento) - giorno(data)) / 86400000);
}
