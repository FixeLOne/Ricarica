package lx.gestionale.tariffa;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaTariffaRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v2/tariffe")
@RequiredArgsConstructor
public class TariffaController {

    private final TariffaService tariffaService;
    private final TariffaRepository tariffaRepository;

    @PostMapping
    public ResponseEntity<Tariffa> salvaTariffa(@RequestBody CreaTariffaRequest request) {
        return ResponseEntity.ok(tariffaService.salvaOAggiorna(request));
    }

    @GetMapping
    public List<Tariffa> getListinoCompleto() {
        return tariffaRepository.findAll();
    }

    @PutMapping("/{id}")
    public ResponseEntity<Tariffa> modificaTariffa(@PathVariable Long id, @RequestBody CreaTariffaRequest request) {
        Tariffa tariffaAggiornata = tariffaService.modificaTariffa(id, request);
        return ResponseEntity.ok(tariffaAggiornata);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminaTariffa(@PathVariable Long id) {
        tariffaService.eliminaTariffa(id);
        return ResponseEntity.noContent().build();
    }
}