import axiosClient from "./axiosClient";

/**
 * GET /api/v2/fatture?page=0&size=20&sort=dataEmissione,desc
 *   Stessa logica di filtraggio per ruolo delle ricariche.
 *
 * Risposta Spring Page:
 *   { content: FatturaResponse[], totalElements, totalPages, number, size }
 */
export const getFatture = (page = 0, size = 20) =>
    axiosClient.get("/fatture", {
        params: { page, size, sort: "dataEmissione,desc" },
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