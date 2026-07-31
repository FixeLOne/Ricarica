// Costanti e helper della lista fatture (filtri, stati, tipi documento).
import {
  CheckCircle2,
  CircleSlash2,
  Clock3,
  FileText,
} from "lucide-react";

export const PAGE_SIZE = 12;
export const ALL_VALUE = "__ALL__";

export const STATO_OPTIONS = [
  { value: ALL_VALUE, label: "Tutte", icon: FileText },
  { value: "BOZZA", label: "Bozze", icon: Clock3 },
  { value: "EMESSA", label: "Emesse", icon: CheckCircle2 },
  { value: "ANNULLATA", label: "Annullate", icon: CircleSlash2 },
];

export const TIPO_OPTIONS = [
  { value: ALL_VALUE, label: "Tutti i tipi" },
  { value: "FACTURE", label: "Fatture" },
  { value: "DEVIS", label: "Devis" },
  { value: "BON_DE_LIVRAISON", label: "BL" },
  { value: "AVOIR", label: "Avoir" },
];

export const STATO_STYLE = {
  BOZZA: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200",
  EMESSA: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200",
  ANNULLATA: "border-stone-200 bg-stone-100 text-stone-600 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300",
};

export function getTipoLabel(tipo) {
  return TIPO_OPTIONS.find((item) => item.value === tipo)?.label ?? tipo ?? "-";
}

export function getStatoLabel(stato) {
  return STATO_OPTIONS.find((item) => item.value === stato)?.label?.replace(/e$/, "a") ?? stato ?? "-";
}

export function compactParams(params) {
  return Object.entries(params).reduce((result, [key, value]) => {
    if (value !== undefined && value !== null && value !== "" && value !== ALL_VALUE) {
      result[key] = value;
    }
    return result;
  }, {});
}

export function normalizeBoutique(boutique) {
  return {
    id: boutique.id,
    nome: boutique.nome,
    citta: boutique.citta ?? "",
  };
}
