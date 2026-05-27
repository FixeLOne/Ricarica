package lx.gestionale.ricarica;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lx.gestionale.ricarica.dto.CreaRicaricaRequest;
import lx.gestionale.ricarica.dto.RicaricaResponse;
import lx.gestionale.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import lx.gestionale.ricarica.dto.StatsOggiResponse;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v2/ricariche")
public class RicaricaController {

    private final RicaricaService ricaricaService;

    @PostMapping
    public ResponseEntity<RicaricaResponse> creaRicarica(
            @Valid @RequestBody CreaRicaricaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        RicaricaResponse ricaricaSalvata = ricaricaService.salvaRicarica(
                request,
                principal.getUtenteId(),
                principal.getBoutiqueId(),
                principal.getRuolo()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(ricaricaSalvata);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaRicarica(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ricaricaService.eliminaRicarica(id, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<RicaricaResponse> modificaRicarica(
            @PathVariable Long id,
            @Valid @RequestBody CreaRicaricaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ricaricaService.modificaRicarica(id, request, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo()));
    }

    @GetMapping
    public ResponseEntity<Page<RicaricaResponse>> getRicariche(
            Pageable pageable,
            @RequestParam(required = false) Long boutiqueId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ricaricaService.getRicariche(
                principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo(), pageable, boutiqueId));
    }

    @GetMapping("/count-oggi")
    public ResponseEntity<Long> countOggi(
            @RequestParam(required = false) Long boutiqueId,
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = ricaricaService.countOggi(
                principal.getUtenteId(),
                principal.getBoutiqueId(),
                principal.getRuolo(),
                boutiqueId
        );
        return ResponseEntity.ok(count);
    }

    @GetMapping("/stats-oggi")
    public ResponseEntity<StatsOggiResponse> getStatsOggi(
            @RequestParam(required = false) Long boutiqueId,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(ricaricaService.getStatsOggi(
                principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo(), boutiqueId));
    }

}
