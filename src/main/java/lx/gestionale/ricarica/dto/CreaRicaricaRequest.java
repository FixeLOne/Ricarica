package lx.gestionale.ricarica.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreaRicaricaRequest {

    @NotBlank(message = "Il numero è obbligatorio")
    private String numero;

    @Positive(message = "I giga devono essere positivi")
    private double giga;

    private boolean manuale;
    private BigDecimal costoEffettivo;
    private BigDecimal costoCliente;
    private Long boutiqueId; // nullable — obbligatorio solo per ADMIN, ignorato per DIPENDENTE
    private String note;
}
