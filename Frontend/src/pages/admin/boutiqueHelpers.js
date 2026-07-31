// Costanti e helper della gestione boutique (filtri, servizi, normalizzazione).
import { FileCheck2, Zap } from "lucide-react";

export const FILTRI_STATO = [
  { id: "tutte", label: "Tutte" },
  { id: "attive", label: "Attive" },
  { id: "disattivate", label: "Disattivate" },
];

export const FILTRI_SERVIZIO = [
  { id: "tutte", label: "Tutte" },
  { id: "attive", label: "Attive" },
  { id: "spente", label: "Spente" },
];

export const SERVIZI_BOUTIQUE = [
  {
    servizio: "RICARICHE",
    serviziKey: "ricariche",
    field: "ricaricheAbilitate",
    label: "Ricariche",
    onText: "Nuove ricariche abilitate",
    offText: "Nuove ricariche bloccate",
    icon: Zap,
  },
  {
    servizio: "FATTURE",
    serviziKey: "fatture",
    field: "fattureAbilitate",
    label: "Fatture",
    onText: "Editor e dati fattura attivi",
    offText: "Fatture disattivate",
    icon: FileCheck2,
  },
];

export function normalizeBoutique(boutique) {
  const servizi = boutique.servizi ?? {};
  const ricaricheAbilitate = servizi.ricariche ?? boutique.ricaricheAbilitate ?? true;
  const fattureAbilitate = servizi.fatture ?? boutique.fattureAbilitate ?? false;

  return {
    ...boutique,
    citta: boutique.citta ?? "",
    ricaricheAbilitate: Boolean(ricaricheAbilitate),
    fattureAbilitate: Boolean(fattureAbilitate),
    attiva: boutique.attiva !== false,
    servizi: {
      ricariche: Boolean(ricaricheAbilitate),
      fatture: Boolean(fattureAbilitate),
    },
  };
}

export function getFiltroLabel(id) {
  return FILTRI_STATO.find((item) => item.id === id)?.label ?? "Filtro";
}

export function getServizioFiltroLabel(servizio, value) {
  const option = FILTRI_SERVIZIO.find((item) => item.id === value);
  return `${servizio} ${option?.label?.toLowerCase() ?? value}`;
}

export function getServiceToggleKey(boutiqueId, servizio) {
  return `${boutiqueId}:${servizio}`;
}
