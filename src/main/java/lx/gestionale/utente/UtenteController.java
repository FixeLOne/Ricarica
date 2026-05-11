package lx.gestionale.utente;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaAdminRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v2/utenti")
@RequiredArgsConstructor
public class UtenteController {

    private final UtenteService utenteService;

    @PostMapping("/admin")
    public ResponseEntity<String> creaAdmin(@Valid @RequestBody CreaAdminRequest request) {
        utenteService.creaAdmin(request);
        return ResponseEntity.ok("Admin creato con successo");
    }
}