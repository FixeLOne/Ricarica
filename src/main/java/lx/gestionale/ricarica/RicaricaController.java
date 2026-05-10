package lx.gestionale.ricarica;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaRicaricaRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v2/ricariche")
public class RicaricaController {

    private final RicaricaService ricaricaService;

    @PostMapping
    public ResponseEntity<Ricarica> creaRicarica(@RequestBody CreaRicaricaRequest request) {

        Ricarica ricaricaSalvata = ricaricaService.salvaRicarica(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ricaricaSalvata);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Ricarica> modificaRicarica(@PathVariable Long id, @RequestBody CreaRicaricaRequest request) {
        Ricarica ricaricaAggiornata = ricaricaService.modificaRicarica(id, request);
        return ResponseEntity.ok(ricaricaAggiornata);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaRicarica(@PathVariable Long id) {
        ricaricaService.eliminaRicarica(id);
        return ResponseEntity.noContent().build();
    }


}
