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
 * BoutiqueResponse: { id, nome, città, ricaricheAbilitate, fattureAbilitate, attiva, servizi }
 *
 * POST /api/v2/boutique
 *   Crea boutique + account DIPENDENTE in un'unica transazione.
 *   CreaBoutiqueRequest: { nome, città, nomeAccount, usernameAccount,
 *                          passwordAccount, fattureAbilitate? (default false) }
 *
 * PATCH /api/v2/boutique/{id}/fatture?abilitato=true|false
 *   Endpoint legacy: abilita o disabilita le fatture per una boutique esistente (solo ADMIN).
 *
 * PATCH /api/v2/boutique/{id}/servizi
 *   Abilita o disabilita un servizio operativo.
 *   ModificaServizioBoutiqueRequest: { servizio: "RICARICHE"|"FATTURE", abilitato }
 *
 * PUT /api/v2/boutique/{id}
 *   Modifica dati base boutique.
 *   ModificaBoutiqueRequest: { nome, città }
 *
 * PATCH /api/v2/boutique/{id}/stato
 *   Attiva/disattiva operativamente una boutique.
 *   ModificaStatoBoutiqueRequest: { attiva }
 *
 * GET /api/v2/boutique/{id}/account
 *   Restituisce l'account operativo singolo della boutique.
 *
 * PATCH /api/v2/boutique/{id}/account/password
 *   Reset password account boutique.
 *   ResetPasswordAccountRequest: { nuovaPassword }
 *
 * PATCH /api/v2/boutique/{id}/account/credentials
 *   Sostituisce username e password account boutique.
 *   ModificaAccountCredenzialiRequest: { username, password }
 *
 * PATCH /api/v2/boutique/{id}/account/stato
 *   Abilita/disabilita solo l'account della boutique.
 *   ModificaAccountStatoRequest: { attivo }
 */
export const getBoutique = () =>
    axiosClient.get("/boutique");

export const getTutteLeBoutique = () =>
    axiosClient.get("/boutique/tutte");

export const getBoutiqueById = (id) =>
    axiosClient.get(`/boutique/${id}`);

export const creaBoutique = (data) =>
    axiosClient.post("/boutique", data);

export const modificaBoutique = (id, data) =>
    axiosClient.put(`/boutique/${id}`, data);

export const modificaStatoBoutique = (id, attiva) =>
    axiosClient.patch(`/boutique/${id}/stato`, { attiva });

export const modificaServizioBoutique = (id, servizio, abilitato) =>
    axiosClient.patch(`/boutique/${id}/servizi`, { servizio, abilitato });

export const impostaFattureAbilitate = (id, abilitato) =>
    axiosClient.patch(`/boutique/${id}/fatture`, null, {
        params: { abilitato },
    });

export const getAccountBoutique = (id) =>
    axiosClient.get(`/boutique/${id}/account`);

export const resetPasswordAccountBoutique = (id, nuovaPassword) =>
    axiosClient.patch(`/boutique/${id}/account/password`, { nuovaPassword });

export const modificaCredenzialiAccountBoutique = (id, data) =>
    axiosClient.patch(`/boutique/${id}/account/credentials`, data);

export const modificaStatoAccountBoutique = (id, attivo) =>
    axiosClient.patch(`/boutique/${id}/account/stato`, { attivo });
