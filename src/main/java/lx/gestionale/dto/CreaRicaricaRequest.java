package lx.gestionale.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreaRicaricaRequest {
    private String numero;
    private double giga;
    private boolean manuale;
    private BigDecimal costoEffettivo;
    private BigDecimal costoCliente;
}
