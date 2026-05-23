import axiosClient from "./axiosClient";

/**
 * GET /api/v2/tariffe
 *   ADMIN       → listino completo dell'admin loggato
 *   SUPER_ADMIN → listino di un admin specifico (passare ?adminId=)
 *
 * TariffaResponse: { id, operatore (null = tariffa standard/generica),
 *                    giga, costoAcquisto, prezzoVendita }
 *   ⚠️ Tutti i valori numerici arrivano come string (BigDecimal) → parseFloat() prima di calcoli
 *   ⚠️ operatore null significa tariffa generica (fallback se non esiste la specifica per operatore)
 *
 * POST /api/v2/tariffe — upsert (aggiorna se esiste già operatore+giga per quell'admin)
 * CreaTariffaRequest: { operatore?, giga, costoAcquisto, prezzoVendita, adminId? (solo SUPER_ADMIN) }
 *   Validazione client obbligatoria: prezzoVendita >= costoAcquisto
 *
 * PUT  /api/v2/tariffe/{id} — modifica tariffa esistente
 * DELETE /api/v2/tariffe/{id} — elimina tariffa
 */
export const getTariffe = (adminId = null) =>
    axiosClient.get("/tariffe", {
        params: adminId ? { adminId } : {},
    });

export const creaTariffa = (data) =>
    axiosClient.post("/tariffe", data);

export const modificaTariffa = (id, data) =>
    axiosClient.put(`/tariffe/${id}`, data);

export const eliminaTariffa = (id) =>
    axiosClient.delete(`/tariffe/${id}`);
