package lx.gestionale.fattura.datiazienda;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.datiazienda.dto.DatiAziendaRequest;
import lx.gestionale.fattura.datiazienda.dto.DatiAziendaResponse;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DatiAziendaService {

    private final DatiAziendaRepository datiAziendaRepository;
    private final UtenteRepository utenteRepository;

    @Transactional
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

    public DatiAziendaResponse getDatiByAdminOrNull(Long adminId) {
        Utente admin = trovaAdmin(adminId);
        return datiAziendaRepository.findByAdmin(admin)
                .map(this::toResponse)
                .orElse(null);
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