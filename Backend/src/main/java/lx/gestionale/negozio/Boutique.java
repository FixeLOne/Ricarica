package lx.gestionale.negozio;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.utente.Utente;

@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
public class Boutique {

    // account operativo del negozio(dipendente generico)

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Dice al DB di generarlo in automatico
    private Long id;

    private String nome;

    private String città;

    private boolean fattureAbilitate = false;

    private boolean attiva = true;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private Utente admin;
}
