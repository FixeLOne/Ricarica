package lx.gestionale.fattura.dto;

import lx.gestionale.fattura.StatoFattura;
import lx.gestionale.fattura.TipoDocumento;

import java.time.LocalDate;

public record FiltroFatture(
        StatoFattura stato,
        TipoDocumento tipo,
        LocalDate dal,
        LocalDate al,
        Long boutiqueId,
        String search
) {
    public String searchNormalizzata() {
        if (search == null || search.isBlank()) {
            return null;
        }
        return "%" + search.trim().toLowerCase() + "%";
    }
}
