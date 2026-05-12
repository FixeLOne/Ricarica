package lx.gestionale.fattura.datiazienda.dto;

import lombok.Data;

@Data
public class DatiAziendaRequest {

    private String ragioneSociale;
    private String indirizzo;
    private String matriculeFiscale;
    private String logo; // base64
}