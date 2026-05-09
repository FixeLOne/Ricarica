package lx.gestionale.dto;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreaRicaricaRequest {
    String numero;
    double giga;
    boolean manuale;
    BigDecimal costoEffettivo;
    BigDecimal costoCliente;
}
