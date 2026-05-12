package lx.gestionale.fattura;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lx.gestionale.utente.Utente;

@Entity
@Data
@NoArgsConstructor
public class DatiAzienda {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String ragioneSociale;

    private String indirizzo;

    private String matriculeFiscale;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String logo; // base64

    @OneToOne
    @JoinColumn(name = "admin_id", nullable = false, unique = true)
    private Utente admin;
}