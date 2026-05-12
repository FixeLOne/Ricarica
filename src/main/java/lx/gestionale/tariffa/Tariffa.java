package lx.gestionale.tariffa;

import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.utente.Utente;

import java.math.BigDecimal;

@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
public class Tariffa {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    private Operatore operatore;

    private double giga;

    private BigDecimal costoAcquisto;
    private BigDecimal prezzoVendita;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private Utente admin;
}