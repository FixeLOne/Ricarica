package lx.gestionale.tariffa;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaTariffaRequest;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

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

    public Tariffa salvaOAggiorna(CreaTariffaRequest request, Long adminId) {
        Utente admin = utenteRepository.getReferenceById(adminId);

        Tariffa tariffa = cercaTariffa(request.getOperatore(), request.getGiga(), admin)
                .orElseGet(Tariffa::new);

        tariffa.setAdmin(admin);
        return popolaESalva(tariffa, request);
    }

    // gestisce il caso null
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

    public Tariffa modificaTariffa(Long id, CreaTariffaRequest request, Long adminId) {
        Tariffa tariffa = tariffaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Impossibile modificare: Tariffa con ID " + id + " non trovata."));

        if (!tariffa.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa tariffa.");
        }

        return popolaESalva(tariffa, request);
    }

    public void eliminaTariffa(Long id, Long adminId) {
        Tariffa tariffa = tariffaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tariffa non trovata."));

        if (!tariffa.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa tariffa.");
        }

        tariffaRepository.deleteById(id);
    }

    public List<Tariffa> getListinoCompleto(Long adminId) {
        Utente admin = utenteRepository.getReferenceById(adminId);
        return tariffaRepository.findByAdmin(admin);
    }
}
