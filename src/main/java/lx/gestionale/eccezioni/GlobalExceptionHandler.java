package lx.gestionale.eccezioni;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> gestisciErroriDiValidazione(IllegalArgumentException ex) {
        // Restituisce un JSON elegante: { "errore": "Il numero deve contenere 8 cifre" }
        return ResponseEntity.badRequest().body(Map.of("errore", ex.getMessage()));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, String>> gestisciStatoIllegale(IllegalStateException ex) {
        log.error("Stato illegale rilevato", ex);
        return ResponseEntity.badRequest().body(Map.of("errore", ex.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> gestisciErroriGenerici(Exception ex) {
        log.error("Errore interno non gestito", ex);
        return ResponseEntity.internalServerError().body(Map.of("errore", "Errore interno del server"));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> gestisciValidazione(MethodArgumentNotValidException ex) {
        String messaggio = ex.getBindingResult().getFieldErrors().stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining(", "));
        return ResponseEntity.badRequest().body(Map.of("errore", messaggio));
    }

}
