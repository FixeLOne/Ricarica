package lx.gestionale.fattura.datiazienda.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class DatiAziendaRequest {

    @NotBlank
    private String ragioneSociale;

    @NotBlank
    private String indirizzo;

    @NotBlank
    private String matriculeFiscale;

    private String logo; // base64
}