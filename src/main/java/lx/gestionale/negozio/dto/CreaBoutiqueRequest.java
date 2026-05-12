package lx.gestionale.negozio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreaBoutiqueRequest {

    @NotBlank
    private String nome;

    @NotBlank
    private String città;

    @NotBlank
    private String nomeAccount;

    @NotBlank
    @Size(min = 3, max = 50)
    private String usernameAccount;

    @NotBlank
    @Size(min = 8)
    private String passwordAccount;
}