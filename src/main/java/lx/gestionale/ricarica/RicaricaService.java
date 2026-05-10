package lx.gestionale.ricarica;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaRicaricaRequest;
import lx.gestionale.tariffa.Tariffa;
import lx.gestionale.tariffa.TariffaService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RicaricaService {

    private final RicaricaRepository ricaricaRepository;

    private final TariffaService tariffaService;

    private Operatore assegnaOperatore(String numero) {

        if (numero.isEmpty()) {
            throw new IllegalArgumentException("Il numero inserito è vuoto.");
        }
        char x = numero.charAt(0);

        return switch (x) {
            case '2', '4' -> Operatore.ooredoo;
            case '5' -> Operatore.orange;
            case '9' -> Operatore.telecom;
            case '3' -> Operatore.fisso;
            default ->
                    throw new IllegalArgumentException("Impossibile determinare l'operatore per il numero: " + numero);
        };
    }

    private void validaNumero(String numero) {

        if (numero == null || numero.isBlank()) {
            throw new IllegalArgumentException("Il numero non può essere vuoto");
        }

        if (!numero.matches("^[0-9]{8}$")) {
            throw new IllegalArgumentException("Il numero deve contenere 8 cifre");
        }
    }

    public Ricarica salvaRicarica(CreaRicaricaRequest request) {
        Ricarica r = new Ricarica();

        popolaDatiRicarica(r, request);

        r.setDataOra(LocalDateTime.now());
        r.setDataSolo(LocalDate.now());

        return ricaricaRepository.save(r);
    }

    private void impostaPrezzi(Ricarica r, CreaRicaricaRequest req, Operatore op) {
        if (req.isManuale()) {
            if (req.getCostoEffettivo() == null || req.getCostoCliente() == null) {
                throw new IllegalArgumentException("Prezzi manuali obbligatori");
            }
            r.setCostoEffettivo(req.getCostoEffettivo());
            r.setCostoCliente(req.getCostoCliente());
        } else {
            Tariffa t = tariffaService.getTariffaApplicabile(op, req.getGiga());
            r.setCostoEffettivo(t.getCostoAcquisto());
            r.setCostoCliente(t.getPrezzoVendita());
        }
    }

    public void eliminaRicarica(Long id) {
        if (!ricaricaRepository.existsById(id)) {
            throw new IllegalArgumentException("Impossibile eliminare: Ricarica con ID " + id + " non trovata.");
        }
        ricaricaRepository.deleteById(id);
    }

    public Ricarica modificaRicarica(Long id, CreaRicaricaRequest request) {
        Ricarica r = ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Impossibile modificare: Ricarica con ID " + id + " non trovata."));

        popolaDatiRicarica(r, request);

        return ricaricaRepository.save(r);
    }

    private void popolaDatiRicarica(Ricarica r, CreaRicaricaRequest request) {
        validaNumero(request.getNumero());
        String numPulito = request.getNumero().trim();
        Operatore operatore = assegnaOperatore(numPulito);

        r.setNumero(numPulito);
        r.setOperatore(operatore);
        r.setGiga(request.getGiga());

        impostaPrezzi(r, request, operatore);
    }

    public List<Ricarica> getRicaricheTra(LocalDate dal, LocalDate al) {
        return ricaricaRepository.findByDataSoloBetween(dal, al);
    }
}