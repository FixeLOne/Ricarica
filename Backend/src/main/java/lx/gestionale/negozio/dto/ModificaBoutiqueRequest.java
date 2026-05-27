package lx.gestionale.negozio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ModificaBoutiqueRequest {

    @NotBlank
    @Size(max = 100)
    private String nome;

    @NotBlank
    @Size(max = 100)
    private String città;

    private boolean fattureAbilitate;
}
