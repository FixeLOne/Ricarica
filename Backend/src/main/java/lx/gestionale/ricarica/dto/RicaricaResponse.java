package lx.gestionale.ricarica.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import lx.gestionale.ricarica.Operatore;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class RicaricaResponse {
    private Long id;
    private LocalDateTime dataOra;
    private LocalDate dataSolo;
    private String numero;
    private Operatore operatore;
    private BigDecimal giga;
    private BigDecimal costoEffettivo;
    private BigDecimal costoCliente;
    private BigDecimal profitto;
    private String note;
    private boolean manuale;
    private boolean eliminato;
    private Long boutiqueId;
    private String boutiqueNome;
}