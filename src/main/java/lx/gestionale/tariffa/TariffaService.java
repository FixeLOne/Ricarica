package lx.gestionale.tariffa;

import lx.gestionale.dto.CreaRicaricaRequest;
import lx.gestionale.dto.CreaTariffaRequest;
import lx.gestionale.ricarica.Operatore;
import lx.gestionale.ricarica.Ricarica;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class TariffaService {

    @Autowired
    TariffaRepository tariffaRepository;



    // restituisce la Tariffa o esplode.
    public Tariffa getTariffaApplicabile(Operatore operatore, double giga) {
        return tariffaRepository.findByOperatoreAndGiga(operatore, giga)
                .orElseGet(() -> tariffaRepository.findByOperatoreIsNullAndGiga(giga)
                        .orElseThrow(() -> new IllegalArgumentException("Tariffa non trovata in listino")));
    }

    public Tariffa salvaOAggiorna(CreaTariffaRequest request) {
        // Cerca la tariffa, se non c'è crea un oggetto vuoto
        Tariffa tariffa = cercaTariffa(request.getOperatore(), request.getGiga())
                .orElseGet(Tariffa::new);
        return popolaESalva(tariffa, request);
    }

    // gestisce il caso null
    private Optional<Tariffa> cercaTariffa(Operatore op, double giga) {
        if (op == null) {
            return tariffaRepository.findByOperatoreIsNullAndGiga(giga);
        }
        return tariffaRepository.findByOperatoreAndGiga(op, giga);
    }

    private Tariffa popolaESalva(Tariffa t, CreaTariffaRequest req) {
        t.setOperatore(req.getOperatore());
        t.setGiga(req.getGiga());
        t.setCostoAcquisto(req.getCostoAcquisto());
        t.setPrezzoVendita(req.getPrezzoVendita());

        return tariffaRepository.save(t);
    }

    public Tariffa modificaTariffa(Long id, CreaTariffaRequest request) {
        Tariffa tariffa = tariffaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Impossibile modificare: Tariffa con ID " + id + " non trovata."));

        return popolaESalva(tariffa, request);
    }

    public void eliminaTariffa(Long id) {
        if (!tariffaRepository.existsById(id)) {
            throw new IllegalArgumentException("Impossibile eliminare: Tariffa con ID " + id + " non trovata.");
        }
        tariffaRepository.deleteById(id);
    }
}
