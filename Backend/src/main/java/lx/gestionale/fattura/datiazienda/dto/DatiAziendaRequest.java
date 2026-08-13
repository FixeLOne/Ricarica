package lx.gestionale.fattura.datiazienda.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class DatiAziendaRequest {

    @NotBlank
    private String ragioneSociale;

    @NotBlank
    private String indirizzo;

    @NotBlank
    private String matriculeFiscale;

    // ── Contatti facoltativi (piè di fattura) ────────────────────────────
    // Valorizzati solo se l'admin li compila: la fattura resta valida senza.

    @Size(max = 40, message = "Il telefono non puo superare 40 caratteri")
    private String telefono;

    @Email(message = "Email non valida")
    @Size(max = 120, message = "L'email non puo superare 120 caratteri")
    private String email;

    @Size(max = 120, message = "Il sito web non puo superare 120 caratteri")
    private String sitoWeb;

    private String logo; // base64
}