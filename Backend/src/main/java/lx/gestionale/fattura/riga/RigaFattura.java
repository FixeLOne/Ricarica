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

    // Scala 3: il dinaro tunisino ha 3 decimali (millimes)
    @Column(nullable = false, precision = 12, scale = 3)
    private BigDecimal quantita;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal prezzoUnitarioHT;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal aliquotaTVA; // es. 19.00

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal scontoPercentuale = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal montanteHT; // calcolato nel service: quantita * prezzoUnitarioHT

    @ManyToOne
    @JoinColumn(name = "fattura_id", nullable = false)
    private Fattura fattura;
}
