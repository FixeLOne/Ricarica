package lx.gestionale.fattura.datiazienda;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.datiazienda.dto.DatiAziendaRequest;
import lx.gestionale.fattura.datiazienda.dto.DatiAziendaResponse;
import lx.gestionale.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v2/azienda")
@RequiredArgsConstructor
public class DatiAziendaController {

    private final DatiAziendaService datiAziendaService;

    @PutMapping
    public ResponseEntity<String> salvaOAggiorna(
            @Valid @RequestBody DatiAziendaRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        datiAziendaService.salvaOAggiorna(request, principal.getUtenteId());
        return ResponseEntity.ok("Dati azienda salvati con successo");
    }

    @GetMapping
    public ResponseEntity<DatiAziendaResponse> getDati(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(datiAziendaService.getDatiByAdmin(principal.getUtenteId()));
    }
}