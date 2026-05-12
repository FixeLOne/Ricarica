package lx.gestionale.negozio.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BoutiqueResponse {
    private Long id;
    private String nome;
    private String città;
    private boolean fattureAbilitate;
}