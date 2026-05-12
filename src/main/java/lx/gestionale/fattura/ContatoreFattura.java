package lx.gestionale.fattura;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lx.gestionale.utente.Utente;

@Entity
@Data
@NoArgsConstructor
@Table(uniqueConstraints = @UniqueConstraint(columnNames = {"admin_id", "anno"}))
public class ContatoreFattura {

    @Id
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