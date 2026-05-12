package lx.gestionale.fattura.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.math.BigDecimal;

@Data
@AllArgsConstructor
public class RigaFatturaResponse {

    private Long id;
    private String descrizione;
    private BigDecimal quantita;
    private BigDecimal prezzoUnitarioHT;
    private BigDecimal aliquotaTVA;
    private BigDecimal montanteHT;
}