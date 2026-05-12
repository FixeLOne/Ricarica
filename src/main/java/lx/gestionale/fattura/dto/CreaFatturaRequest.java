package lx.gestionale.fattura.dto;

import lombok.Data;
import lx.gestionale.fattura.TipoDocumento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
public class CreaFatturaRequest {

    private TipoDocumento tipo;

    private LocalDate dataEmissione;

    private String nomeCliente;

    private boolean timbreFiscal = false;

    private BigDecimal remiseGlobale = BigDecimal.ZERO;

    private List<RigaFatturaRequest> righe;

    private Long fatturaOrigineId; // nullable — solo per Avoir

    private Long boutiqueId; // nullable — obbligatorio solo per ADMIN, ignorato per DIPENDENTE
}