package lx.gestionale.fattura.riga;

import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.fattura.Fattura;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
public class RigaFattura {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(length = 50)
    private String reference;

    private String descrizione;

    @Column(nullable = false)
    private BigDecimal quantita;

    @Column(nullable = false)
    private BigDecimal prezzoUnitarioHT;

    @Column(nullable = false)
    private BigDecimal aliquotaTVA; // es. 19.00

    @Column(nullable = false)
    private BigDecimal scontoPercentuale = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal montanteHT; // calcolato nel service: quantita * prezzoUnitarioHT

    @ManyToOne
    @JoinColumn(name = "fattura_id", nullable = false)
    private Fattura fattura;
}
