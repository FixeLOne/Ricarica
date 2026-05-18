package lx.gestionale.fattura.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Data;
import lx.gestionale.fattura.TipoDocumento;
import lx.gestionale.fattura.riga.dto.RigaFatturaRequest;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreaFatturaRequest {

    @NotNull(message = "Il tipo documento è obbligatorio")
    private TipoDocumento tipo;

    private LocalDate dataEmissione = LocalDate.now();

    @Size(max = 150, message = "Il nome cliente non può superare 150 caratteri")
    @Pattern(regexp = "^[^<>]*$", message = "Caratteri < o > non ammessi per ragioni di sicurezza")
    private String nomeCliente;

    private boolean timbreFiscal = false;

    @NotNull(message = "La remise globale è obbligatoria (usa 0 se assente)")
    @DecimalMin(value = "0.00", message = "La remise non può essere negativa")
    private BigDecimal remiseGlobale = BigDecimal.ZERO;

    @NotEmpty(message = "La fattura deve avere almeno una riga")
    @Valid
    private List<RigaFatturaRequest> righe;

    private Long fatturaOrigineId; // nullable — solo per Avoir

    private Long boutiqueId; // nullable — obbligatorio solo per ADMIN, ignorato per DIPENDENTE
}