package lx.gestionale.tariffa.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lx.gestionale.ricarica.Operatore;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class TariffaResponse {
    private Long id;
    private Operatore operatore;
    private BigDecimal giga;
    private BigDecimal costoAcquisto;
    private BigDecimal prezzoVendita;
}