package lx.gestionale.fattura;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.dto.CreaFatturaRequest;
import lx.gestionale.fattura.dto.FiltroFatture;
import lx.gestionale.fattura.dto.FatturaResponse;
import lx.gestionale.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/v2/fatture")
@RequiredArgsConstructor
public class FatturaController {

    private final FatturaService fatturaService;

    @PostMapping
    public ResponseEntity<FatturaResponse> creaFattura(
            @Valid @RequestBody CreaFatturaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fatturaService.creaFattura(request, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FatturaResponse> modificaFattura(
            @PathVariable Long id,
            @Valid @RequestBody CreaFatturaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.modificaFattura(id, request, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo()));
    }

    @PatchMapping("/{id}/emetti")
    public ResponseEntity<FatturaResponse> emettiFattura(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.emettiFattura(id, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo()));
    }

    @PostMapping("/{id}/avoir")
    public ResponseEntity<FatturaResponse> creaAvoir(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(fatturaService.creaAvoir(id, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo()));
    }

    @GetMapping
    public ResponseEntity<Page<FatturaResponse>> getFatture(
            Pageable pageable,
            @RequestParam(required = false) StatoFattura stato,
            @RequestParam(required = false) TipoDocumento tipo,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dal,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate al,
            @RequestParam(required = false) Long boutiqueId,
            @RequestParam(required = false) String search,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.getFatture(
                principal.getUtenteId(),
                principal.getBoutiqueId(),
                principal.getRuolo(),
                pageable,
                new FiltroFatture(stato, tipo, dal, al, boutiqueId, search)
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FatturaResponse> getFatturaById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(fatturaService.getFatturaById(id, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaFattura(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        fatturaService.eliminaFattura(id, principal.getUtenteId(), principal.getBoutiqueId(), principal.getRuolo());
        return ResponseEntity.noContent().build();
    }
}
