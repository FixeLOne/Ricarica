package lx.gestionale.negozio.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class BoutiqueAccountResponse {
    private Long id;
    private String nome;
    private String username;
    private boolean attivo;
    private Long boutiqueId;
    private String boutiqueNome;
}
