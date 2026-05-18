package lx.gestionale.fattura.riga.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class RigaFatturaRequest {
    @NotBlank(message = "La descrizione è obbligatoria")
    @Pattern(regexp = "^[^<>]*$", message = "Caratteri < o > non ammessi per ragioni di sicurezza")
    private String descrizione;

    @NotNull(message = "La quantità è obbligatoria")
    @Positive(message = "La quantità deve essere positiva")
    private BigDecimal quantita;

    @NotNull(message = "Il prezzo unitario è obbligatorio")
    @PositiveOrZero(message = "Il prezzo unitario non può essere negativo")
    private BigDecimal prezzoUnitarioHT;

    @NotNull(message = "L'aliquota TVA è obbligatoria")
    @DecimalMin(value = "0", message = "L'aliquota TVA non può essere negativa")
    @DecimalMax(value = "100", message = "L'aliquota TVA non può superare 100")
    private BigDecimal aliquotaTVA;
}