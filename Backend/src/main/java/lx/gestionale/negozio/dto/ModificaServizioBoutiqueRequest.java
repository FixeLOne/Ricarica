package lx.gestionale.negozio.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lx.gestionale.negozio.BoutiqueServizio;

@Data
public class ModificaServizioBoutiqueRequest {
    @NotNull
    private BoutiqueServizio servizio;

    private boolean abilitato;
}
