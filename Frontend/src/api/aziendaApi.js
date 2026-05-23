import axiosClient from "./axiosClient";

/**
 * GET /api/v2/azienda — solo ADMIN
 *   Restituisce i dati aziendali dell'admin loggato.
 *   DatiAziendaResponse: { ragioneSociale, indirizzo, matriculeFiscale, logo (base64 | null) }
 *
 * PUT /api/v2/azienda — ADMIN e DIPENDENTE
 *   Upsert: crea se non esiste, aggiorna se esiste già.
 *   DatiAziendaRequest: { ragioneSociale, indirizzo, matriculeFiscale, logo? (base64) }
 *
 * ⚠️ Il logo va convertito in base64 lato frontend prima dell'invio
 *    (FileReader.readAsDataURL → rimuovere il prefisso "data:image/...;base64,")
 */
export const getDatiAzienda = () =>
    axiosClient.get("/azienda");

export const salvaDatiAzienda = (data) =>
    axiosClient.put("/azienda", data);
