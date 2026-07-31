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

export function normalizzaDocumentoPerApi(documento) {
  return {
    tipo: documento.tipo,
    dataEmissione: documento.dataEmissione,
    nomeCliente: documento.nomeCliente?.trim() || null,
    timbreFiscal: Boolean(documento.timbreFiscal),
    logoIntestazioneVisibile: Boolean(documento.logoIntestazioneVisibile),
    logoWatermarkVisibile: Boolean(documento.logoWatermarkVisibile),
    remiseGlobale: toMoneyString(documento.remiseGlobale),
    boutiqueId: documento.boutiqueId ? Number(documento.boutiqueId) : null,
    righe: (documento.righe ?? []).map((riga) => ({
      reference: riga.reference?.trim() || null,
      descrizione: riga.descrizione?.trim() || "",
      quantita: toMoneyString(riga.quantita || 1),
      prezzoUnitarioHT: toMoneyString(riga.prezzoUnitarioHT),
      aliquotaTVA: String(riga.aliquotaTVA ?? "19"),
      scontoPercentuale: Number(riga.scontoPercentuale ?? 0).toFixed(2),
    })),
  };
}
