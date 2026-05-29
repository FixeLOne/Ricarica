package lx.gestionale.negozio.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ModificaAccountStatoRequest {
    @NotNull
    private Boolean attivo;
}
