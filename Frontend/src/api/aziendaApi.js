import axiosClient from "./axiosClient";

/**
 * GET /api/v2/azienda - ADMIN e DIPENDENTE
 *   Restituisce i dati aziendali usati per fatture e documenti.
 *   DatiAziendaResponse: { ragioneSociale, indirizzo, matriculeFiscale, logo (base64 | null) }
 *
 * PUT /api/v2/azienda - solo ADMIN
 *   Upsert: crea se non esiste, aggiorna se esiste gia.
 *   DatiAziendaRequest: { ragioneSociale, indirizzo, matriculeFiscale, logo? (base64) }
 *
 * Il logo va convertito in base64 lato frontend prima dell'invio
 * (FileReader.readAsDataURL e rimozione del prefisso "data:image/...;base64,").
 */
export const getDatiAzienda = () =>
    axiosClient.get("/azienda");

export const salvaDatiAzienda = (data) =>
    axiosClient.put("/azienda", data);
