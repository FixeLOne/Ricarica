package lx.gestionale.negozio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lx.gestionale.negozio.dto.BoutiqueResponse;
import lx.gestionale.negozio.dto.CreaBoutiqueRequest;
import lx.gestionale.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/boutique")
@RequiredArgsConstructor
public class BoutiqueController {

    private final BoutiqueService boutiqueService;

    @PostMapping
    public ResponseEntity<String> creaBoutique(
            @Valid @RequestBody CreaBoutiqueRequest request,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        boutiqueService.creaBoutique(request, userPrincipal.getUsername());
        return ResponseEntity.ok("Boutique creata con successo");
    }

    @GetMapping
    public ResponseEntity<List<BoutiqueResponse>> getBoutiqueDelAdmin(
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        return ResponseEntity.ok(boutiqueService.getBoutiqueDelAdmin(userPrincipal.getUsername()));
    }

    @GetMapping("/tutte")
    public ResponseEntity<List<BoutiqueResponse>> getTutteLeBoutique() {
        return ResponseEntity.ok(boutiqueService.getTutteLeBoutique());
    }

    @PatchMapping("/{id}/fatture")
    public ResponseEntity<String> impostaFattureAbilitate(
            @PathVariable Long id,
            @RequestParam boolean abilitato,
            @AuthenticationPrincipal UserPrincipal principal) {
        boutiqueService.impostaFattureAbilitate(id, abilitato, principal.getUtenteId());
        return ResponseEntity.ok("Fatture " + (abilitato ? "abilitate" : "disabilitate") + " con successo");
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoutiqueResponse> getBoutiqueById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueService.getBoutiqueById(id, principal.getUtenteId(), principal.getRuolo()));
    }
}