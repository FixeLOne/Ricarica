package lx.gestionale.fattura.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.Data;
import lx.gestionale.fattura.TipoDocumento;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreaFatturaRequest {

    @NotNull(message = "Il tipo documento e obbligatorio")
    private TipoDocumento tipo;

    @NotNull(message = "La data documento e obbligatoria")
    private LocalDate dataEmissione = LocalDate.now();

    @Size(max = 150, message = "Il nome cliente non puo superare 150 caratteri")
    @Pattern(regexp = "^[^<>]*$", message = "Caratteri < o > non ammessi per ragioni di sicurezza")
    private String nomeCliente;

    @Size(max = 200, message = "L'indirizzo cliente non puo superare 200 caratteri")
    @Pattern(regexp = "^[^<>]*$", message = "Caratteri < o > non ammessi per ragioni di sicurezza")
    private String indirizzoCliente;

    @Size(max = 80, message = "La matricule fiscale cliente non puo superare 80 caratteri")
    @Pattern(regexp = "^[^<>]*$", message = "Caratteri < o > non ammessi per ragioni di sicurezza")
    private String matriculeFiscaleCliente;

    private boolean timbreFiscal = false;

    private boolean logoIntestazioneVisibile = true;

    private boolean logoWatermarkVisibile = false;

    @NotNull(message = "La remise globale e obbligatoria (usa 0 se assente)")
    @DecimalMin(value = "0.00", message = "La remise non puo essere negativa")
    @Digits(integer = 12, fraction = 3, message = "La remise puo avere massimo 12 cifre intere e 3 decimali")
    private BigDecimal remiseGlobale = BigDecimal.ZERO;

    @NotEmpty(message = "La fattura deve avere almeno una riga")
    @Valid
    private List<RigaFatturaRequest> righe;

    private Long fatturaOrigineId;

    private Long boutiqueId;
}
