package lx.gestionale.negozio;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lx.gestionale.utente.Utente;

@Entity
@Data
@NoArgsConstructor
public class Boutique {

    // account operativo del negozio(dipendente generico)

    @Id // Dichiara che è la Primary Key
    @GeneratedValue(strategy = GenerationType.IDENTITY) // Dice al DB di generarlo in automatico
    private Long id;

    private String nome;

    private String città;

    private boolean fattureAbilitate = false;

    @ManyToOne
    @JoinColumn(name = "admin_id")
    private Utente admin;
}
