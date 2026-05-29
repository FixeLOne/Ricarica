package lx.gestionale.negozio.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ResetPasswordAccountRequest {

    @NotBlank
    @Size(min = 8, max = 72)
    private String nuovaPassword;
}
