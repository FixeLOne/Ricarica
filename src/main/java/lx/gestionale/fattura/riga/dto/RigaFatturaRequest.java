package lx.gestionale.fattura.riga.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RigaFatturaRequest {

    private String descrizione;

    private BigDecimal quantita;

    private BigDecimal prezzoUnitarioHT;

    private BigDecimal aliquotaTVA;
}