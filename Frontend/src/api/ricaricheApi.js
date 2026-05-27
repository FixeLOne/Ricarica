import axiosClient from "./axiosClient";

/**
 * GET /api/v2/ricariche?page=0&size=20&sort=dataOra,desc
 *   Il service filtra automaticamente per ruolo dal JWT:
 *   DIPENDENTE  → solo sua boutique
 *   ADMIN       → tutte le sue boutique
 *   SUPER_ADMIN → tutto il sistema
 *
 * Risposta Spring Page:
 *   { content: RicaricaResponse[], totalElements, totalPages, number, size }
 * RicaricaResponse: { id, dataOra, dataSolo, numero, operatore, giga,
 *                     costoEffettivo, costoCliente, profitto, note,
 *                     boutiqueId, boutiqueNome }
 */
export const getRicariche = (page = 0, size = 12) =>
    axiosClient.get("/ricariche", {
        params: { page, size, sort: "dataOra,desc" },
    });

export const creaRicarica = (data) =>
    axiosClient.post("/ricariche", data);

export const modificaRicarica = (id, data) =>
    axiosClient.put(`/ricariche/${id}`, data);

export const eliminaRicarica = (id) =>
    axiosClient.delete(`/ricariche/${id}`);

export const countOggi = () =>
    axiosClient.get("/ricariche/count-oggi");