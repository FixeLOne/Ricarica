package lx.gestionale.tariffa.dto;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lx.gestionale.ricarica.Operatore;
import java.math.BigDecimal;

@Data
public class CreaTariffaRequest {

    private Operatore operatore; // Può essere null per le tariffe "Standard"

    @Positive
    @NotNull
    private BigDecimal giga;

    @NotNull
    @Positive
    @Digits(integer = 8, fraction = 3, message = "Importo fuori scala")
    private BigDecimal costoAcquisto;

    @NotNull @Positive
    @Digits(integer = 8, fraction = 3, message = "Importo fuori scala")
    private BigDecimal prezzoVendita;

    private Long adminId; // nullable — usato solo da SUPER_ADMIN

    @AssertTrue(message = "Il costo di acquisto non può superare il prezzo di vendita")
    public boolean isMargineValido() {
        if (costoAcquisto == null || prezzoVendita == null) return true; // già gestito da @NotNull
        return costoAcquisto.compareTo(prezzoVendita) <= 0;
    }
}