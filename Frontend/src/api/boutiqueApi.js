import axiosClient from "./axiosClient";

/**
 * GET /api/v2/boutique
 *   ADMIN → lista delle proprie boutique
 *
 * GET /api/v2/boutique/tutte
 *   SUPER_ADMIN → tutte le boutique del sistema
 *
 * GET /api/v2/boutique/{id}
 *   ADMIN, SUPER_ADMIN → singola boutique (IDOR protetto lato backend)
 *
 * BoutiqueResponse: { id, nome, città, fattureAbilitate }
 *
 * POST /api/v2/boutique
 *   Crea boutique + account DIPENDENTE in un'unica transazione.
 *   CreaBoutiqueRequest: { nome, città, nomeAccount, usernameAccount,
 *                          passwordAccount, fattureAbilitate? (default false) }
 *
 * PATCH /api/v2/boutique/{id}/fatture?abilitato=true|false
 *   Abilita o disabilita le fatture per una boutique esistente (solo ADMIN).
 */
export const getBoutique = () =>
    axiosClient.get("/boutique");

export const getTutteLeBoutique = () =>
    axiosClient.get("/boutique/tutte");

export const getBoutiqueById = (id) =>
    axiosClient.get(`/boutique/${id}`);

export const creaBoutique = (data) =>
    axiosClient.post("/boutique", data);

export const impostaFattureAbilitate = (id, abilitato) =>
    axiosClient.patch(`/boutique/${id}/fatture`, null, {
        params: { abilitato },
    });