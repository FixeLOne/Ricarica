package lx.gestionale.utente;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;
import lx.gestionale.negozio.Boutique;

@Entity
@Getter
@Setter
@EqualsAndHashCode(onlyExplicitlyIncluded = true)
@NoArgsConstructor
public class Utente {

    // solo SUPER_ADMIN e ADMIN PER IL MOMENTO

    @Id
    @EqualsAndHashCode.Include
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String username;

    private String password;

    private boolean attivo = true;

    private long tokenVersion = 0L;

    @Enumerated(EnumType.STRING)
    private Ruolo ruolo;

    @ManyToOne
    @JoinColumn(name = "boutique_id")
    @JsonIgnore
    private Boutique boutique;
}
