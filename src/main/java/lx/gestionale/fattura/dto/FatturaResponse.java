package lx.gestionale.fattura.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lx.gestionale.fattura.StatoFattura;
import lx.gestionale.fattura.TipoDocumento;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Data
@AllArgsConstructor
public class FatturaResponse {

    private Long id;
    private String numero;
    private TipoDocumento tipo;
    private StatoFattura stato;
    private LocalDate dataEmissione;
    private String nomeCliente;
    private boolean timbreFiscal;
    private BigDecimal remiseGlobale;
    private BigDecimal totaleHT;
    private BigDecimal totaleTVA;
    private BigDecimal totaleNet;
    private String nomeBoutique;
    private List<RigaFatturaResponse> righe;
    private String fatturaOrigineNumero; // nullable
}