import axiosClient from "./axiosClient";

/**
 * GET /api/v2/fatture?page=0&size=20
 *
 * Nessun "sort": l'ordinamento lo decide il backend (ultimo salvataggio in
 * cima). Mandarlo da qui lo sovrascriveva, ed era il motivo per cui una
 * fattura appena emessa non risaliva la lista.
 *
 * Filtri opzionali:
 *   { stato, tipo, dal, al, boutiqueId, search }
 *
 * Risposta Spring Page (Boot 4 annida i metadati sotto "page"):
 *   { content: FatturaResponse[], page: { totalElements, totalPages, number, size } }
 */
export const getFatture = (page = 0, size = 20, filters = {}) =>
    axiosClient.get("/fatture", {
        params: { page, size, ...filters },
    });

export const getFatturaById = (id) =>
    axiosClient.get(`/fatture/${id}`);

export const creaFattura = (data) =>
    axiosClient.post("/fatture", data);

export const modificaFattura = (id, data) =>
    axiosClient.put(`/fatture/${id}`, data);

export const emettiFattura = (id) =>
    axiosClient.patch(`/fatture/${id}/emetti`);

export const creaAvoir = (id) =>
    axiosClient.post(`/fatture/${id}/avoir`);

export const eliminaFattura = (id) =>
    axiosClient.delete(`/fatture/${id}`);
