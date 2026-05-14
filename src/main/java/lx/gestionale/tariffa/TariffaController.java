package lx.gestionale.tariffa;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lx.gestionale.tariffa.dto.CreaTariffaRequest;
import lx.gestionale.security.UserPrincipal;
import lx.gestionale.tariffa.dto.TariffaResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/tariffe")
@RequiredArgsConstructor
public class TariffaController {

    private final TariffaService tariffaService;

    @PostMapping
    public ResponseEntity<TariffaResponse> salvaTariffa(
            @Valid @RequestBody CreaTariffaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(tariffaService.salvaOAggiorna(request, principal.getUtenteId(), principal.getRuolo()));
    }

    @GetMapping
    public ResponseEntity<List<TariffaResponse>> getListinoCompleto(
            @RequestParam(required = false) Long adminId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(tariffaService.getListinoCompleto(adminId, principal.getUtenteId(), principal.getRuolo()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TariffaResponse> modificaTariffa(
            @PathVariable Long id,
            @Valid @RequestBody CreaTariffaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(tariffaService.modificaTariffa(id, request, principal.getUtenteId(), principal.getRuolo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaTariffa(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        tariffaService.eliminaTariffa(id, principal.getUtenteId(), principal.getRuolo());
        return ResponseEntity.noContent().build();
    }
}