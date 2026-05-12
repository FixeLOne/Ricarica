package lx.gestionale.fattura;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.dto.CreaFatturaRequest;
import lx.gestionale.fattura.dto.FatturaResponse;
import lx.gestionale.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/fatture")
@RequiredArgsConstructor
public class FatturaController {

    private final FatturaService fatturaService;

    @PostMapping
    public ResponseEntity<FatturaResponse> creaFattura(
            @RequestBody CreaFatturaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fatturaService.creaFattura(request, principal.getUtenteId(), principal.getBoutiqueId()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FatturaResponse> modificaFattura(
            @PathVariable Long id,
            @RequestBody CreaFatturaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.modificaFattura(
                id, request, principal.getUtenteId(), principal.getBoutiqueId()));
    }

    @PatchMapping("/{id}/emetti")
    public ResponseEntity<FatturaResponse> emettiFattura(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.emettiFattura(
                id, principal.getUtenteId(), principal.getBoutiqueId()));
    }

    @PostMapping("/{id}/avoir")
    public ResponseEntity<FatturaResponse> creaAvoir(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fatturaService.creaAvoir(id, principal.getUtenteId(), principal.getBoutiqueId()));
    }

    @GetMapping
    public ResponseEntity<List<FatturaResponse>> getFatture(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.getFatture(
                principal.getUtenteId(), principal.getBoutiqueId()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FatturaResponse> getFatturaById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.getFatturaById(
                id, principal.getUtenteId(), principal.getBoutiqueId()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaFattura(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        fatturaService.eliminaFattura(id, principal.getUtenteId(), principal.getBoutiqueId());
        return ResponseEntity.noContent().build();
    }
}