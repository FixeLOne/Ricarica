import axiosClient from "./axiosClient";

/**
 * GET /api/v2/dashboard/riepilogo
 *
 * Risposta per DIPENDENTE:
 *   { conteggioRicariche: number, profitto: string (BigDecimal) }
 *
 * Risposta per ADMIN / SUPER_ADMIN:
 *   [{ boutiqueId, nome, totaleOperazioni, profittoTotale }, ...]
 *
 * Il backend usa LocalDate.now() → dati sempre riferiti a OGGI.
 */
export const getDashboardRiepilogo = () =>
    axiosClient.get("/dashboard/riepilogo");