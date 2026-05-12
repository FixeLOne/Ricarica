package lx.gestionale.fattura.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DatiAziendaResponse {

    private String ragioneSociale;
    private String indirizzo;
    private String matriculeFiscale;
    private String logo; // base64
}