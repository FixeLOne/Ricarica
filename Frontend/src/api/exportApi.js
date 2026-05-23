import axiosClient from "./axiosClient";

/**
 * GET /api/v2/export/ricariche?dal=YYYY-MM-DD&al=YYYY-MM-DD
 *   ADMIN       → ricariche di tutte le sue boutique nel range
 *   SUPER_ADMIN → tutte le ricariche del sistema nel range
 *
 *   Risposta: blob binario .xlsx (Apache POI)
 *   Gestire con responseType: 'blob' e URL.createObjectURL() per il download.
 *
 *   Validazioni client obbligatorie prima di chiamare:
 *   - dal non può essere dopo al
 *   - al non può essere nel futuro
 *   - range massimo 366 giorni
 */
export const esportaRicariche = (dal, al) =>
    axiosClient.get("/export/ricariche", {
        params: { dal, al },
        responseType: "blob",
    });
