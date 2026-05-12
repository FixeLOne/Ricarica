package lx.gestionale.fattura;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Entity
@Data
@NoArgsConstructor
public class RigaFattura {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String descrizione;

    @Column(nullable = false)
    private BigDecimal quantita;

    @Column(nullable = false)
    private BigDecimal prezzoUnitarioHT;

    @Column(nullable = false)
    private BigDecimal aliquotaTVA; // es. 19.00

    @Column(nullable = false)
    private BigDecimal montanteHT; // calcolato nel service: quantita * prezzoUnitarioHT

    @ManyToOne
    @JoinColumn(name = "fattura_id", nullable = false)
    private Fattura fattura;
}