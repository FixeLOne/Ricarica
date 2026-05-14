package lx.gestionale.tariffa;

import lombok.RequiredArgsConstructor;
import lx.gestionale.tariffa.dto.CreaTariffaRequest;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.tariffa.dto.TariffaResponse;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TariffaService {

    private final UtenteRepository utenteRepository;

    private final TariffaRepository tariffaRepository;



    // restituisce la Tariffa o esplode.
    public Tariffa getTariffaApplicabile(Operatore operatore, double giga, Utente admin) {
        return tariffaRepository.findByOperatoreAndGigaAndAdmin(operatore, giga, admin)
                .orElseGet(() -> tariffaRepository.findByOperatoreIsNullAndGigaAndAdmin(giga, admin)
                        .orElseThrow(() -> new IllegalArgumentException("Tariffa non trovata in listino")));
    }

    public TariffaResponse salvaOAggiorna(CreaTariffaRequest request, Long utenteId, String ruolo) {
        Long adminId = "SUPER_ADMIN".equals(ruolo) && request.getAdminId() != null
                ? request.getAdminId()
                : utenteId;
        Utente admin = utenteRepository.getReferenceById(adminId);
        Tariffa tariffa = cercaTariffa(request.getOperatore(), request.getGiga(), admin)
                .orElseGet(Tariffa::new);
        tariffa.setAdmin(admin);
        return toResponse(popolaESalva(tariffa, request));
    }

    public List<TariffaResponse> getListinoCompleto(Long adminIdParam, Long utenteId, String ruolo) {
        Long adminId = "SUPER_ADMIN".equals(ruolo) && adminIdParam != null
                ? adminIdParam
                : utenteId;
        Utente admin = utenteRepository.getReferenceById(adminId);
        return tariffaRepository.findByAdmin(admin).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }


    private Optional<Tariffa> cercaTariffa(Operatore op, double giga, Utente admin) {
        if (op == null) {
            return tariffaRepository.findByOperatoreIsNullAndGigaAndAdmin(giga, admin);
        }
        return tariffaRepository.findByOperatoreAndGigaAndAdmin(op, giga, admin);
    }

    private Tariffa popolaESalva(Tariffa t, CreaTariffaRequest req) {
        t.setOperatore(req.getOperatore());
        t.setGiga(req.getGiga());
        t.setCostoAcquisto(req.getCostoAcquisto());
        t.setPrezzoVendita(req.getPrezzoVendita());
        return tariffaRepository.save(t);
    }

    public TariffaResponse modificaTariffa(Long id, CreaTariffaRequest request, Long adminId, String ruolo) {
        Tariffa tariffa = tariffaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Impossibile modificare: Tariffa con ID " + id + " non trovata."));
        if (!"SUPER_ADMIN".equals(ruolo) && !tariffa.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa tariffa.");
        }
        return toResponse(popolaESalva(tariffa, request));
    }

    public void eliminaTariffa(Long id, Long adminId, String ruolo) {
        Tariffa tariffa = tariffaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tariffa non trovata."));
        if (!"SUPER_ADMIN".equals(ruolo) && !tariffa.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa tariffa.");
        }
        tariffaRepository.deleteById(id);
    }

    private TariffaResponse toResponse(Tariffa t) {
        return new TariffaResponse(
                t.getId(),
                t.getOperatore(),
                t.getGiga(),
                t.getCostoAcquisto(),
                t.getPrezzoVendita()
        );
    }
}
