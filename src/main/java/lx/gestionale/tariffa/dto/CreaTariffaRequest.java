package lx.gestionale.tariffa.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lx.gestionale.ricarica.Operatore;
import java.math.BigDecimal;

@Data
public class CreaTariffaRequest {

    private Operatore operatore; // Può essere null per le tariffe "Standard"

    @Positive
    private double giga;

    @NotNull
    @Positive
    private BigDecimal costoAcquisto;

    @NotNull @Positive
    private BigDecimal prezzoVendita;

    private Long adminId; // nullable — usato solo da SUPER_ADMIN
}