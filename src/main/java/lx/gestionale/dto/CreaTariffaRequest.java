package lx.gestionale.dto;

import lombok.Data;
import lx.gestionale.ricarica.Operatore;
import java.math.BigDecimal;

@Data
public class CreaTariffaRequest {
    private Operatore operatore; // Può essere null per le tariffe "Standard"
    private double giga;
    private BigDecimal costoAcquisto;
    private BigDecimal prezzoVendita;
}