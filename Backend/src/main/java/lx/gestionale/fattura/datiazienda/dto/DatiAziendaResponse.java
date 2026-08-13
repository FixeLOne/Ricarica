package lx.gestionale.fattura.datiazienda.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class DatiAziendaResponse {

    private String ragioneSociale;
    private String indirizzo;
    private String matriculeFiscale;
    private String telefono;   // facoltativo
    private String email;      // facoltativo
    private String sitoWeb;    // facoltativo
    private String logo; // base64
}