package lx.gestionale.fattura.riga.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lx.gestionale.fattura.validation.AliquotaTvaAmmessa;

import java.math.BigDecimal;

@Data
public class RigaFatturaRequest {

    @Size(max = 50, message = "La referenza non puo superare 50 caratteri")
    @Pattern(regexp = "^[^<>]*$", message = "Caratteri < o > non ammessi per ragioni di sicurezza")
    private String reference;

    // Non obbligatoria in salvataggio: una bozza si salva anche a meta. La
    // descrizione diventa obbligatoria all'emissione, controllata da
    // FatturaService.validaRigheEmissione.
    @Size(max = 255, message = "La descrizione non puo superare 255 caratteri")
    @Pattern(regexp = "^[^<>]*$", message = "Caratteri < o > non ammessi per ragioni di sicurezza")
    private String descrizione;

    @NotNull(message = "La quantita e obbligatoria")
    // Zero e ammesso in bozza (campo svuotato mentre si scrive): la quantita
    // deve essere positiva solo per emettere.
    @PositiveOrZero(message = "La quantita non puo essere negativa")
    @Digits(integer = 10, fraction = 3, message = "La quantita puo avere massimo 10 cifre intere e 3 decimali")
    private BigDecimal quantita;

    @NotNull(message = "Il prezzo unitario e obbligatorio")
    @PositiveOrZero(message = "Il prezzo unitario non puo essere negativo")
    @Digits(integer = 12, fraction = 3, message = "Il prezzo unitario puo avere massimo 12 cifre intere e 3 decimali")
    private BigDecimal prezzoUnitarioHT;

    @NotNull(message = "L'aliquota TVA e obbligatoria")
    @DecimalMin(value = "0", message = "L'aliquota TVA non puo essere negativa")
    @DecimalMax(value = "100", message = "L'aliquota TVA non puo superare 100")
    @Digits(integer = 3, fraction = 2, message = "L'aliquota TVA puo avere massimo 2 decimali")
    @AliquotaTvaAmmessa
    private BigDecimal aliquotaTVA;

    @NotNull(message = "Lo sconto riga e obbligatorio (usa 0 se assente)")
    @DecimalMin(value = "0.00", message = "Lo sconto riga non puo essere negativo")
    @DecimalMax(value = "100.00", message = "Lo sconto riga non puo superare 100")
    @Digits(integer = 3, fraction = 2, message = "Lo sconto riga puo avere massimo 2 decimali")
    private BigDecimal scontoPercentuale = BigDecimal.ZERO;
}
