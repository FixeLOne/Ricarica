import { toNumber } from "@/lib/format";

export const TVA_OPTIONS = ["0", "7", "13", "19"];

export const TIPO_DOCUMENTO_OPTIONS = [
  { value: "FACTURE", label: "Facture" },
  { value: "DEVIS", label: "Devis" },
  { value: "BON_DE_LIVRAISON", label: "Bon de livraison" },
];

export const TIMBRE_FISCAL_DEFAULT = 1;

export function toMoneyString(value) {
  return toNumber(value).toFixed(3);
}

function roundMoney(value) {
  return Math.round((toNumber(value) + Number.EPSILON) * 1000) / 1000;
}

export function getTipoLabel(tipo) {
  if (tipo === "AVOIR") return "Avoir";
  return TIPO_DOCUMENTO_OPTIONS.find((item) => item.value === tipo)?.label ?? tipo ?? "-";
}

export function getLogoSrc(logo) {
  if (!logo) return null;
  return logo.startsWith("data:") ? logo : `data:image/png;base64,${logo}`;
}

export function calcolaRiga(riga) {
  const quantita = toNumber(riga.quantita);
  const prezzoUnitarioHT = toNumber(riga.prezzoUnitarioHT);
  const scontoPercentuale = Math.min(Math.max(toNumber(riga.scontoPercentuale), 0), 100);
  const montanteLordo = quantita * prezzoUnitarioHT;
  const montanteHT = roundMoney(montanteLordo * (1 - scontoPercentuale / 100));

  return {
    montanteHT,
  };
}

export function calcolaTotaliDocumento(documento, timbreFiscalValue = TIMBRE_FISCAL_DEFAULT) {
  const righe = documento.righe ?? [];
  const totaleHT = righe.reduce((totale, riga) => totale + calcolaRiga(riga).montanteHT, 0);
  const remiseGlobale = roundMoney(Math.min(Math.max(toNumber(documento.remiseGlobale), 0), totaleHT));
  const totaleHTNet = roundMoney(totaleHT - remiseGlobale);
  const totaleTVA = calcolaTvaSuBaseNetta(righe, totaleHT, remiseGlobale);
  const timbreFiscalMontant = documento.timbreFiscal ? toNumber(timbreFiscalValue) : 0;
  const totaleNet = roundMoney(totaleHTNet + totaleTVA + timbreFiscalMontant);

  return {
    totaleHT: roundMoney(totaleHT),
    totaleHTNet,
    totaleTVA,
    remiseGlobale,
    timbreFiscalMontant: roundMoney(timbreFiscalMontant),
    totaleNet,
  };
}

/**
 * Dettaglio TVA per aliquota (base imponibile netta + imposta), calcolato
 * lato client cosi l'anteprima resta aggiornata mentre si digita. Il backend
 * espone lo stesso riepilogo in FatturaResponse per gli usi non visuali
 * (export, integrazioni), con la stessa ripartizione proporzionale della
 * remise globale.
 */
export function calcolaRiepilogoTva(documento) {
  const righe = documento?.righe ?? [];
  const totaleHT = righe.reduce((totale, riga) => totale + calcolaRiga(riga).montanteHT, 0);
  if (totaleHT <= 0) return [];

  const remiseGlobale = roundMoney(
    Math.min(Math.max(toNumber(documento?.remiseGlobale), 0), totaleHT),
  );

  const basiPerAliquota = righe.reduce((groups, riga) => {
    const aliquota = toNumber(riga.aliquotaTVA);
    groups.set(aliquota, (groups.get(aliquota) ?? 0) + calcolaRiga(riga).montanteHT);
    return groups;
  }, new Map());

  return Array.from(basiPerAliquota.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([aliquota, baseHT]) => {
      const quotaRemise = remiseGlobale * (baseHT / totaleHT);
      const baseNetta = Math.max(baseHT - quotaRemise, 0);
      return {
        aliquota,
        imponibile: roundMoney(baseNetta),
        imposta: roundMoney(baseNetta * (aliquota / 100)),
      };
    });
}

function calcolaTvaSuBaseNetta(righe, totaleHT, remiseGlobale) {
  if (totaleHT <= 0) return 0;

  const basiPerAliquota = righe.reduce((groups, riga) => {
    const aliquota = String(toNumber(riga.aliquotaTVA));
    const baseHT = calcolaRiga(riga).montanteHT;
    groups.set(aliquota, (groups.get(aliquota) ?? 0) + baseHT);
    return groups;
  }, new Map());

  return roundMoney(Array.from(basiPerAliquota.entries()).reduce((totale, [aliquota, baseHT]) => {
    const quotaRemise = remiseGlobale * (baseHT / totaleHT);
    const baseNetta = Math.max(baseHT - quotaRemise, 0);
    return totale + roundMoney(baseNetta * (toNumber(aliquota) / 100));
  }, 0));
}

const UNITA = [
  "zéro", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf",
  "dix", "onze", "douze", "treize", "quatorze", "quinze", "seize",
  "dix-sept", "dix-huit", "dix-neuf",
];
const DECINE = ["", "", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante", "quatre-vingt", "quatre-vingt"];

/** 0-99 in lettere, con le irregolarita francesi di 70-79 e 90-99. */
function sotto100(n) {
  if (n < 20) return UNITA[n];
  const d = Math.floor(n / 10);
  const u = n % 10;
  // 70-79 e 90-99 si formano su 60/80 + 10-19 (soixante-dix, quatre-vingt-onze)
  if (d === 7 || d === 9) {
    const base = DECINE[d];
    const resto = UNITA[10 + u];
    return u === 1 && d === 7 ? `${base} et onze` : `${base}-${resto}`;
  }
  if (u === 0) return d === 8 ? "quatre-vingts" : DECINE[d];
  if (u === 1) return d === 8 ? "quatre-vingt-un" : `${DECINE[d]} et un`;
  return `${DECINE[d]}-${UNITA[u]}`;
}

function sotto1000(n) {
  const c = Math.floor(n / 100);
  const resto = n % 100;
  if (c === 0) return sotto100(resto);
  // "cent" resta invariabile se seguito da altro: deux cents / deux cent un
  const centinaia = c === 1 ? "cent" : `${UNITA[c]} cent${resto === 0 ? "s" : ""}`;
  return resto === 0 ? centinaia : `${centinaia} ${sotto100(resto)}`;
}

/** Intero in lettere (francese), fino ai milioni: sufficiente per un documento. */
function interoInLettere(n) {
  if (n === 0) return UNITA[0];
  const parti = [];
  const milioni = Math.floor(n / 1_000_000);
  const migliaia = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;

  if (milioni > 0) parti.push(`${milioni === 1 ? "un million" : `${sotto1000(milioni)} millions`}`);
  // "mille" e invariabile: deux mille, non "deux milles"
  if (migliaia > 0) parti.push(migliaia === 1 ? "mille" : `${sotto1000(migliaia)} mille`);
  if (resto > 0) parti.push(sotto1000(resto));

  return parti.join(" ");
}

/**
 * Importo in lettere per la formula d'uso sui documenti tunisini:
 * il dinaro ha 3 decimali (millimes), quindi 128,520 DT diventa
 * "cent vingt-huit dinars cinq cent vingt millimes".
 */
export function importoInLettere(valore) {
  const totale = Math.max(toNumber(valore), 0);
  const dinari = Math.floor(totale);
  const millimes = Math.round((totale - dinari) * 1000);

  const parteDinari = `${interoInLettere(dinari)} ${dinari === 1 ? "dinar" : "dinars"}`;
  if (millimes === 0) return parteDinari;
  return `${parteDinari} ${interoInLettere(millimes)} ${millimes === 1 ? "millime" : "millimes"}`;
}

/**
 * Riga appena aggiunta e non ancora toccata: nessun riferimento, nessuna
 * descrizione, prezzo a zero. Non porta informazione, quindi non viene
 * salvata — altrimenti basterebbe premere "Aggiungi articolo" per rendere
 * il documento non valido e bloccare l'autosave di tutto il resto.
 */
export function rigaVuota(riga) {
  return (
    !riga.reference?.trim() &&
    !riga.descrizione?.trim() &&
    !(Number(riga.prezzoUnitarioHT) > 0)
  );
}

export function normalizzaDocumentoPerApi(documento) {
  return {
    tipo: documento.tipo,
    dataEmissione: documento.dataEmissione,
    nomeCliente: documento.nomeCliente?.trim() || null,
    indirizzoCliente: documento.indirizzoCliente?.trim() || null,
    matriculeFiscaleCliente: documento.matriculeFiscaleCliente?.trim() || null,
    timbreFiscal: Boolean(documento.timbreFiscal),
    logoIntestazioneVisibile: Boolean(documento.logoIntestazioneVisibile),
    logoWatermarkVisibile: Boolean(documento.logoWatermarkVisibile),
    remiseGlobale: toMoneyString(documento.remiseGlobale),
    boutiqueId: documento.boutiqueId ? Number(documento.boutiqueId) : null,
    righe: (documento.righe ?? []).filter((riga) => !rigaVuota(riga)).map((riga) => ({
      reference: riga.reference?.trim() || null,
      descrizione: riga.descrizione?.trim() || "",
      quantita: toMoneyString(riga.quantita || 1),
      prezzoUnitarioHT: toMoneyString(riga.prezzoUnitarioHT),
      aliquotaTVA: String(riga.aliquotaTVA ?? "19"),
      scontoPercentuale: Number(riga.scontoPercentuale ?? 0).toFixed(2),
    })),
  };
}
