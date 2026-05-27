package lx.gestionale.ricarica;

import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.negozio.Boutique;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@Entity
@NoArgsConstructor
public class Ricarica {

    // ----------------------Campi di Identificazione e Tempo----------------------
    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Dice al DB di generarlo in automatico
    private Long id;

    private LocalDateTime dataOra;

    private LocalDate dataSolo; // Ottimizzato per le query della dashboard

    // ----------------------Dati della Transazione (Input Utente)----------------------

    private String numero;

    @Enumerated(EnumType.STRING)
    private Operatore operatore;

    @Column(nullable = false)
    private BigDecimal giga;

    private boolean manuale;

    private boolean eliminato = false;

    // ----------------------Dati Finanziari (Contabilità)----------------------

    private BigDecimal costoEffettivo;

    private BigDecimal costoCliente;

    private BigDecimal profitto;

    //------------------------  EXTRA -------------------------------------------

    private String note;

    @ManyToOne
    @JoinColumn(name = "boutique_id")
    private Boutique boutique;

}
