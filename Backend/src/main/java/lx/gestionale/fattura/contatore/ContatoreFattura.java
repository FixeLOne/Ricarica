package lx.gestionale.fattura.contatore;

import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.fattura.TipoDocumento;
import lx.gestionale.utente.Utente;

/**
 * Progressivo di una serie documentale: un contatore per ogni combinazione di
 * admin, anno e tipo documento.
 *
 * Il tipo fa parte della chiave perche ogni serie deve essere una sequenza
 * ininterrotta. Con un contatore condiviso un avoir consumava un numero della
 * serie fatture, che diventava FAC-2026-0001, FAC-2026-0003, ... — un salto che
 * in sede di controllo e indistinguibile da una fattura emessa e fatta sparire.
 */
@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"admin_id", "anno", "tipo"}))
public class ContatoreFattura {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int anno;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TipoDocumento tipo;

    @Column(nullable = false)
    private int ultimoNumero = 0;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private Utente admin;
}