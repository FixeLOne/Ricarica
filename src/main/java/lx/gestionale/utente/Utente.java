package lx.gestionale.utente;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lx.gestionale.negozio.Boutique;

@Entity
@Data
@NoArgsConstructor
public class Utente {

    // solo SUPER_ADMIN e ADMIN PER IL MOMENTO

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nome;

    private String username;

    private String password;

    @Enumerated(EnumType.STRING)
    private Ruolo ruolo;

    @ManyToOne
    @JoinColumn(name = "boutique_id")
    @JsonIgnore
    private Boutique boutique;
}
