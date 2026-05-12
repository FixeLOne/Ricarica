package lx.gestionale.ricarica;

import lombok.RequiredArgsConstructor;
import lx.gestionale.ricarica.dto.CreaRicaricaRequest;
import lx.gestionale.ricarica.dto.RicaricaResponse;
import lx.gestionale.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v2/ricariche")
public class RicaricaController {

    private final RicaricaService ricaricaService;

    @PostMapping
    public ResponseEntity<RicaricaResponse> creaRicarica(
            @RequestBody CreaRicaricaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        RicaricaResponse ricaricaSalvata = ricaricaService.salvaRicarica(request, principal.getUtenteId(), principal.getBoutiqueId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ricaricaSalvata);
    }

    @PutMapping("/{id}")
    public ResponseEntity<RicaricaResponse> modificaRicarica(
            @PathVariable Long id,
            @RequestBody CreaRicaricaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        RicaricaResponse ricaricaAggiornata = ricaricaService.modificaRicarica(id, request, principal.getBoutiqueId(), principal.getRuolo());
        return ResponseEntity.ok(ricaricaAggiornata);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaRicarica(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ricaricaService.eliminaRicarica(id, principal.getBoutiqueId(), principal.getRuolo());
        return ResponseEntity.noContent().build();
    }


}
