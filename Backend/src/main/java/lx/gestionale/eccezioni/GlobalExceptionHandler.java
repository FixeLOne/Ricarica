package lx.gestionale.eccezioni;

import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

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

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, String>> gestisciJsonMalformato(HttpMessageNotReadableException ex) {
        return ResponseEntity.badRequest().body(Map.of("errore", "Formato JSON non valido o valore non riconosciuto"));
    }

    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, String>> gestisciTipoErrato(MethodArgumentTypeMismatchException ex) {
        return ResponseEntity.badRequest().body(Map.of("errore", "Parametro non valido: " + ex.getName()));
    }

    @ExceptionHandler(MissingServletRequestParameterException.class)
    public ResponseEntity<Map<String, String>> gestisciParametroMancante(MissingServletRequestParameterException ex) {
        return ResponseEntity.badRequest().body(Map.of("errore", "Parametro mancante: " + ex.getParameterName()));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> gestisciEntitaNonTrovata(EntityNotFoundException ex) {
        return ResponseEntity.badRequest().body(Map.of("errore", ex.getMessage()));
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<Map<String, String>> gestisciMetodoNonSupportato(Exception ex) {
        return ResponseEntity.status(405).body(Map.of("errore", "Metodo HTTP non supportato per questo URL"));
    }

    @ExceptionHandler(HttpMediaTypeNotSupportedException.class)
    public ResponseEntity<Map<String, String>> gestisciMediaTypeNonSupportato(
            org.springframework.web.HttpMediaTypeNotSupportedException ex) {
        return ResponseEntity.status(415).body(Map.of("errore", "Content-Type non supportato."));
    }

}
