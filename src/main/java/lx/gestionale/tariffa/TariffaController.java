package lx.gestionale.tariffa;

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
            @RequestBody CreaTariffaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(tariffaService.salvaOAggiorna(request, principal.getUtenteId()));
    }

    @GetMapping
    public ResponseEntity<List<TariffaResponse>> getListinoCompleto(@AuthenticationPrincipal UserPrincipal principal) {
        // Ora passa per il Service e filtra per Admin!
        return ResponseEntity.ok(tariffaService.getListinoCompleto(principal.getUtenteId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TariffaResponse> modificaTariffa(
            @PathVariable Long id,
            @RequestBody CreaTariffaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(tariffaService.modificaTariffa(id, request, principal.getUtenteId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaTariffa(@PathVariable Long id, @AuthenticationPrincipal UserPrincipal principal) {
        tariffaService.eliminaTariffa(id, principal.getUtenteId());
        return ResponseEntity.noContent().build();
    }
}