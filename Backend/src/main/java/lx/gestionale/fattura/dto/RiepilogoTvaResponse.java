package lx.gestionale.fattura.dto;

import java.math.BigDecimal;

/**
 * Una riga del riepilogo TVA: per ogni aliquota presente nel documento
 * riporta la base imponibile (al netto della quota di remise globale) e
 * l'imposta corrispondente.
 *
 * Serve quando la fattura mescola piu aliquote (0/7/13/19): il solo totale
 * TVA aggregato non permetterebbe di distinguere base e imposta per
 * aliquota, dettaglio richiesto su una fattura valida.
 */
public record RiepilogoTvaResponse(
        BigDecimal aliquota,
        BigDecimal imponibile,
        BigDecimal imposta
) {
}
