import axiosClient from "./axiosClient";

/**
 * POST /api/v2/utenti/admin — solo SUPER_ADMIN
 *   Crea un nuovo account ADMIN.
 *   CreaAdminRequest: { username, password }
 *
 * ⚠️ Non esiste un endpoint GET per la lista degli admin.
 *    La AdminListPage mostra solo il form di creazione.
 */
export const creaAdmin = (data) =>
    axiosClient.post("/utenti/admin", data);
