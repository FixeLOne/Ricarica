package lx.gestionale.fattura;

import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.fattura.riga.RigaFattura;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.utente.Utente;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(uniqueConstraints = @UniqueConstraint(name = "uk_fattura_admin_numero", columnNames = {"admin_id", "numero"}))
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
public class Fattura {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String numero;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDocumento tipo;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private StatoFattura stato = StatoFattura.BOZZA;

    @Column(nullable = false)
    private LocalDate dataEmissione;

    private String nomeCliente;

    // Dati B2B del cliente: facoltativi, restano vuoti per le vendite al
    // banco ("client passager"), obbligatori di fatto perche il cliente
    // azienda possa detrarre la TVA.
    private String indirizzoCliente;

    private String matriculeFiscaleCliente;

    private boolean timbreFiscal = false;

    // Scala 3: il dinaro tunisino ha 3 decimali (millimes)
    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal timbreFiscalMontant = BigDecimal.ZERO;

    private boolean logoIntestazioneVisibile = true;

    private boolean logoWatermarkVisibile = false;

    @Column(precision = 15, scale = 3)
    private BigDecimal remiseGlobale = BigDecimal.ZERO;

    // ── Totali (calcolati nel service) ────────────────────────

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal totaleHT = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal totaleTVA = BigDecimal.ZERO;

    @Column(nullable = false, precision = 15, scale = 3)
    private BigDecimal totaleNet = BigDecimal.ZERO;

    // ── Relazioni ─────────────────────────────────────────────

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private Utente admin;

    @ManyToOne
    @JoinColumn(name = "boutique_id")
    private Boutique boutique; // nullable — presente solo se creata da un dipendente

    @ManyToOne
    @JoinColumn(name = "fattura_origine_id")
    private Fattura fatturaOrigine; // solo per Avoir

    @OneToMany(mappedBy = "fattura", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<RigaFattura> righe = new ArrayList<>();
}
