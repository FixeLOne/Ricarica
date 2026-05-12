package lx.gestionale.fattura.contatore;

import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.utente.Utente;

@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"admin_id", "anno"}))
public class ContatoreFattura {

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private int anno;

    @Column(nullable = false)
    private int ultimoNumero = 0;

    @ManyToOne
    @JoinColumn(name = "admin_id", nullable = false)
    private Utente admin;
}