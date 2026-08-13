// Helper del profilo azienda: validazione, normalizzazione e gestione logo.
import { z } from "zod";

import { getApiError } from "@/api/apiError";

export const MAX_LOGO_SIZE = 1_000_000;
export const ACCEPTED_LOGO_TYPES = ["image/png"];

// Contatti: facoltativi (stringa vuota ammessa), validati solo se compilati.
const contattoFacoltativo = (max, messaggio) =>
  z
    .string()
    .trim()
    .max(max, messaggio)
    .optional()
    .or(z.literal(""));

export const aziendaSchema = z.object({
  ragioneSociale: z.string().trim().min(2, "Inserisci almeno 2 caratteri").max(140, "Massimo 140 caratteri"),
  indirizzo: z.string().trim().min(3, "Inserisci almeno 3 caratteri").max(180, "Massimo 180 caratteri"),
  matriculeFiscale: z.string().trim().min(3, "Inserisci almeno 3 caratteri").max(80, "Massimo 80 caratteri"),
  telefono: contattoFacoltativo(40, "Massimo 40 caratteri"),
  email: z
    .string()
    .trim()
    .max(120, "Massimo 120 caratteri")
    .email("Email non valida")
    .optional()
    .or(z.literal("")),
  sitoWeb: contattoFacoltativo(120, "Massimo 120 caratteri"),
});

export const emptyValues = {
  ragioneSociale: "",
  indirizzo: "",
  matriculeFiscale: "",
  telefono: "",
  email: "",
  sitoWeb: "",
};

export function isNotConfigured(error) {
  const message = getApiError(error).toLowerCase();
  return error?.response?.status === 400 && message.includes("non ancora configurati");
}

export function normalizeCompany(data) {
  if (!data) return null;

  return {
    ragioneSociale: data.ragioneSociale ?? "",
    indirizzo: data.indirizzo ?? "",
    matriculeFiscale: data.matriculeFiscale ?? "",
    telefono: data.telefono ?? "",
    email: data.email ?? "",
    sitoWeb: data.sitoWeb ?? "",
    logo: data.logo ?? null,
  };
}

export function isConfigured(company) {
  return Boolean(
    company?.ragioneSociale?.trim() &&
      company?.indirizzo?.trim() &&
      company?.matriculeFiscale?.trim()
  );
}

export function logoToSrc(logo) {
  if (!logo) return null;
  if (logo.startsWith("data:")) return logo;
  return `data:image/png;base64,${logo}`;
}

function stripDataUrlPrefix(value) {
  return value.replace(/^data:.*;base64,/, "");
}

export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(stripDataUrlPrefix(String(reader.result ?? "")));
    reader.onerror = () => reject(new Error("Logo non leggibile"));
    reader.readAsDataURL(file);
  });
}

export function toFormValues(company) {
  return {
    ragioneSociale: company?.ragioneSociale ?? "",
    indirizzo: company?.indirizzo ?? "",
    matriculeFiscale: company?.matriculeFiscale ?? "",
    telefono: company?.telefono ?? "",
    email: company?.email ?? "",
    sitoWeb: company?.sitoWeb ?? "",
  };
}
