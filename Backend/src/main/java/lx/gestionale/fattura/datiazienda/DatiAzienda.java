package lx.gestionale.fattura.datiazienda;

import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.utente.Utente;

@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
public class DatiAzienda {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ragioneSociale;

    private String indirizzo;

    private String matriculeFiscale;

    // Contatti facoltativi, stampati a piè di fattura se valorizzati.
    private String telefono;

    private String email;

    private String sitoWeb;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String logo; // base64

    @OneToOne
    @JoinColumn(name = "admin_id", nullable = false, unique = true)
    private Utente admin;
}