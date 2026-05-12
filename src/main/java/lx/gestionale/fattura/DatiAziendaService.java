package lx.gestionale.fattura;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.dto.DatiAziendaRequest;
import lx.gestionale.fattura.dto.DatiAziendaResponse;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class DatiAziendaService {

    private final DatiAziendaRepository datiAziendaRepository;
    private final UtenteRepository utenteRepository;

    public void salvaOAggiorna(DatiAziendaRequest request, Long adminId) {
        Utente admin = trovaAdmin(adminId);
        DatiAzienda dati = datiAziendaRepository.findByAdmin(admin)
                .orElse(new DatiAzienda());

        dati.setAdmin(admin);
        dati.setRagioneSociale(request.getRagioneSociale());
        dati.setIndirizzo(request.getIndirizzo());
        dati.setMatriculeFiscale(request.getMatriculeFiscale());
        dati.setLogo(request.getLogo());

        datiAziendaRepository.save(dati);
    }

    public DatiAziendaResponse getDatiByAdmin(Long adminId) {
        Utente admin = trovaAdmin(adminId);
        DatiAzienda dati = datiAziendaRepository.findByAdmin(admin)
                .orElseThrow(() -> new IllegalArgumentException("Dati azienda non ancora configurati"));
        return toResponse(dati);
    }

    // ── Privati ───────────────────────────────────────────────────────────────

    private DatiAziendaResponse toResponse(DatiAzienda dati) {
        return new DatiAziendaResponse(
                dati.getRagioneSociale(),
                dati.getIndirizzo(),
                dati.getMatriculeFiscale(),
                dati.getLogo()
        );
    }

    private Utente trovaAdmin(Long adminId) {
        return utenteRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin non trovato"));
    }
}