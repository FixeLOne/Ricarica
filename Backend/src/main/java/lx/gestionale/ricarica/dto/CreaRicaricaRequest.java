package lx.gestionale.ricarica.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreaRicaricaRequest {

    @NotBlank(message = "Il numero è obbligatorio")
    private String numero;

    @Positive(message = "I giga devono essere positivi")
    @NotNull
    private BigDecimal giga;

    private boolean manuale;
    private BigDecimal costoEffettivo;
    private BigDecimal costoCliente;
    private Long boutiqueId; // nullable — obbligatorio solo per ADMIN, ignorato per DIPENDENTE

    @Size(max = 255)
    @Pattern(regexp = "^[^<>]*$")
    private String note;

    @AssertTrue(message = "Il costo effettivo non può superare il prezzo al cliente")
    public boolean isMargineValido() {
        if (costoEffettivo == null || costoCliente == null) return true; // già gestito altrove
        return costoEffettivo.compareTo(costoCliente) <= 0;
    }
}
