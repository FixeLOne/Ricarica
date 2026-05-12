package lx.gestionale.ricarica;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaRicaricaRequest;
import lx.gestionale.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v2/ricariche")
public class RicaricaController {

    private final RicaricaService ricaricaService;

    @PostMapping
    public ResponseEntity<Ricarica> creaRicarica(
            @RequestBody CreaRicaricaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) { //  Catturiamo chi fa la richiesta

        // Passiamo il suo ID negozio al Service
        Ricarica ricaricaSalvata = ricaricaService.salvaRicarica(request, principal.getUtenteId(), principal.getBoutiqueId());
        return ResponseEntity.status(HttpStatus.CREATED).body(ricaricaSalvata);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ricarica> modificaRicarica(
            @PathVariable Long id,
            @RequestBody CreaRicaricaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        Ricarica ricaricaAggiornata = ricaricaService.modificaRicarica(id, request, principal.getBoutiqueId());
        return ResponseEntity.ok(ricaricaAggiornata);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaRicarica(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        ricaricaService.eliminaRicarica(id, principal.getBoutiqueId());
        return ResponseEntity.noContent().build();
    }


}
