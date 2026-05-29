package lx.gestionale.negozio;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lx.gestionale.negozio.dto.BoutiqueAccountResponse;
import lx.gestionale.negozio.dto.BoutiqueResponse;
import lx.gestionale.negozio.dto.CreaBoutiqueRequest;
import lx.gestionale.negozio.dto.ModificaAccountCredenzialiRequest;
import lx.gestionale.negozio.dto.ModificaAccountStatoRequest;
import lx.gestionale.negozio.dto.ModificaBoutiqueRequest;
import lx.gestionale.negozio.dto.ModificaServizioBoutiqueRequest;
import lx.gestionale.negozio.dto.ModificaStatoBoutiqueRequest;
import lx.gestionale.negozio.dto.ResetPasswordAccountRequest;
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
    private final BoutiqueAccountService boutiqueAccountService;

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

    @PatchMapping("/{id}/stato")
    public ResponseEntity<BoutiqueResponse> modificaStatoBoutique(
            @PathVariable Long id,
            @Valid @RequestBody ModificaStatoBoutiqueRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueService.modificaStatoBoutique(id, request.isAttiva(), principal.getUtenteId()));
    }

    @PatchMapping("/{id}/servizi")
    public ResponseEntity<BoutiqueResponse> modificaServizioBoutique(
            @PathVariable Long id,
            @Valid @RequestBody ModificaServizioBoutiqueRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueService.modificaServizioBoutique(
                id,
                request.getServizio(),
                request.isAbilitato(),
                principal.getUtenteId()
        ));
    }

    @GetMapping("/{id}/account")
    public ResponseEntity<BoutiqueAccountResponse> getAccountBoutique(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueAccountService.getAccount(id, principal.getUtenteId()));
    }

    @PatchMapping("/{id}/account/password")
    public ResponseEntity<BoutiqueAccountResponse> resetPasswordAccount(
            @PathVariable Long id,
            @Valid @RequestBody ResetPasswordAccountRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueAccountService.resetPassword(
                id,
                request.getNuovaPassword(),
                principal.getUtenteId()
        ));
    }

    @PatchMapping("/{id}/account/credentials")
    public ResponseEntity<BoutiqueAccountResponse> modificaCredenzialiAccount(
            @PathVariable Long id,
            @Valid @RequestBody ModificaAccountCredenzialiRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueAccountService.modificaCredenziali(
                id,
                request.getUsername(),
                request.getPassword(),
                principal.getUtenteId()
        ));
    }

    @PatchMapping("/{id}/account/stato")
    public ResponseEntity<BoutiqueAccountResponse> modificaStatoAccount(
            @PathVariable Long id,
            @Valid @RequestBody ModificaAccountStatoRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueAccountService.modificaStato(
                id,
                request.getAttivo(),
                principal.getUtenteId()
        ));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BoutiqueResponse> getBoutiqueById(
            @PathVariable Long id,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueService.getBoutiqueById(
                id,
                principal.getUtenteId(),
                principal.getRuolo(),
                principal.getBoutiqueId()
        ));
    }

    @PutMapping("/{id}")
    public ResponseEntity<BoutiqueResponse> modificaBoutique(
            @PathVariable Long id,
            @Valid @RequestBody ModificaBoutiqueRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(boutiqueService.modificaBoutique(
                id,
                request,
                principal.getUtenteId(),
                principal.getRuolo()
        ));
    }
}
