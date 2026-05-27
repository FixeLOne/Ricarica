package lx.gestionale.tariffa;

import lombok.RequiredArgsConstructor;
import lx.gestionale.tariffa.dto.CreaTariffaRequest;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.tariffa.dto.TariffaResponse;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TariffaService {

    private final UtenteRepository utenteRepository;

    private final TariffaRepository tariffaRepository;



    // restituisce la Tariffa o esplode.
    @Transactional(readOnly = true)
    public Tariffa getTariffaApplicabile(Operatore operatore, BigDecimal giga, Utente admin) {
        return tariffaRepository.findByOperatoreAndGigaAndAdmin(operatore, giga, admin)
                .orElseGet(() -> tariffaRepository.findByOperatoreIsNullAndGigaAndAdmin(giga, admin)
                        .orElseThrow(() -> new IllegalArgumentException("Tariffa non trovata in listino")));
    }

    @Transactional
    public TariffaResponse salvaOAggiorna(CreaTariffaRequest request, Long utenteId, String ruolo) {
        Long adminId;

        if ("SUPER_ADMIN".equals(ruolo)) {
            if (request.getAdminId() == null) {
                throw new IllegalArgumentException("Il SUPER_ADMIN deve specificare l'adminId nel corpo della richiesta.");
            }
            adminId = request.getAdminId();
        } else {
            adminId = utenteId;
        }

        Utente admin = utenteRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin con ID " + adminId + " non trovato"));
        Tariffa tariffa = cercaTariffa(request.getOperatore(), request.getGiga(), admin)
                .orElseGet(Tariffa::new);
        tariffa.setAdmin(admin);
        return toResponse(popolaESalva(tariffa, request));
    }

    @Transactional(readOnly = true)
    public List<TariffaResponse> getListinoCompleto(Long IdParam, Long utenteId, String ruolo) {
        Long adminId;

        if ("SUPER_ADMIN".equals(ruolo)) {
            if (IdParam == null) {
                throw new IllegalArgumentException("Il SUPER_ADMIN deve specificare il parametro adminId nella query string.");
            }
            adminId = IdParam;

        } else if ("DIPENDENTE".equals(ruolo)) {
            Utente dip = utenteRepository.findById(utenteId)
                    .orElseThrow(() -> new IllegalArgumentException("Utente non trovato"));
            adminId = dip.getBoutique().getAdmin().getId();
        } else {
            adminId = utenteId; // ADMIN
        }

        Utente admin = utenteRepository.findById(adminId)
                .orElseThrow(() -> new IllegalArgumentException("Admin con ID " + adminId + " non trovato"));
        return tariffaRepository.findByAdmin(admin).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }


    @Transactional(readOnly = true)
    public Optional<Tariffa> cercaTariffa(Operatore op, BigDecimal giga, Utente admin) {
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

    @Transactional
    public TariffaResponse modificaTariffa(Long id, CreaTariffaRequest request, Long adminId, String ruolo) {
        Tariffa tariffa = tariffaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Impossibile modificare: Tariffa con ID " + id + " non trovata."));

        if (!"SUPER_ADMIN".equals(ruolo) && !tariffa.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa tariffa.");
        }

        // verifica che la nuova chiave naturale non appartenga a un'altra riga
        Utente admin = tariffa.getAdmin();
        cercaTariffa(request.getOperatore(), request.getGiga(), admin)
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(ignored -> {
                    throw new IllegalArgumentException(
                            "Esiste già una tariffa con questa combinazione di operatore e giga.");
                });

        return toResponse(popolaESalva(tariffa, request));
    }

    @Transactional
    public void eliminaTariffa(Long id, Long adminId, String ruolo) {
        Tariffa tariffa = tariffaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Tariffa non trovata."));
        if (!"SUPER_ADMIN".equals(ruolo) && !tariffa.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa tariffa.");
        }
        tariffaRepository.delete(tariffa);
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
