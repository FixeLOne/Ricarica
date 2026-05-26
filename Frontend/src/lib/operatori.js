export const OPERATORI = {
  "2": "OOREDOO",
  "4": "OOREDOO",
  "5": "ORANGE",
  "9": "TELECOM",
  "3": "FISSO",
};

export const COLORI_OPERATORE = {
  OOREDOO: { bg: "bg-red-50 dark:bg-red-900/20",     text: "text-[#E30613] dark:text-[#ff4d57]" },
  ORANGE:  { bg: "bg-orange-50 dark:bg-orange-900/20", text: "text-[#FF6600] dark:text-[#ff8533]" },
  TELECOM: { bg: "bg-blue-50 dark:bg-blue-900/20",   text: "text-[#003DA5] dark:text-[#4d80d4]" },
  FISSO:   { bg: "bg-cyan-50 dark:bg-cyan-900/20",   text: "text-cyan-600 dark:text-cyan-400" },
};

export function operatoreDaNumero(numero) {
  if (!numero || numero.length === 0) return null;
  return OPERATORI[numero[0]] ?? null;
}

/** Jackson serializza LocalDateTime come array [y,m,d,h,min,s] con mese 1-based */
export function parseLocalDateTime(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const [y, m, d, h = 0, min = 0, s = 0] = val;
    return new Date(y, m - 1, d, h, min, s);
  }
  return new Date(val);
}

export function parseLocalDate(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const [y, m, d] = val;
    return new Date(y, m - 1, d);
  }
  return new Date(val);
}

export function formatOra(val) {
  const d = parseLocalDateTime(val);
  if (!d) return "—";
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

export function formatDataOra(val) {
  const d = parseLocalDateTime(val);
  if (!d) return "—";
  return d.toLocaleString("it-IT", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}
