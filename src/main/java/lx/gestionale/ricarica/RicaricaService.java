package lx.gestionale.ricarica;

import lombok.RequiredArgsConstructor;
import lx.gestionale.ricarica.dto.CreaRicaricaRequest;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.ricarica.dto.RicaricaResponse;
import lx.gestionale.tariffa.Tariffa;
import lx.gestionale.tariffa.TariffaService;
import lx.gestionale.utente.Utente;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class RicaricaService {

    private final RicaricaRepository ricaricaRepository;

    private final TariffaService tariffaService;

    private final BoutiqueRepository boutiqueRepository;

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

    public RicaricaResponse salvaRicarica(CreaRicaricaRequest request, Long utenteId, Long boutiqueId) {
        Boutique boutique;

        if (boutiqueId != null) {
            // DIPENDENTE — usa boutiqueId dal token
            boutique = boutiqueRepository.findById(boutiqueId)
                    .orElseThrow(() -> new IllegalArgumentException("Boutique non trovata"));
        } else {
            // ADMIN — boutiqueId obbligatorio nel body
            if (request.getBoutiqueId() == null) {
                throw new IllegalArgumentException("Specifica la boutique per la ricarica");
            }
            boutique = boutiqueRepository.findById(request.getBoutiqueId())
                    .orElseThrow(() -> new IllegalArgumentException("Boutique non trovata"));
            if (!boutique.getAdmin().getId().equals(utenteId)) {
                throw new IllegalArgumentException("Non hai i permessi su questa boutique");
            }
        }
        Ricarica r = new Ricarica();
        r.setBoutique(boutique);
        r.setDataOra(LocalDateTime.now());
        r.setDataSolo(LocalDate.now());

        popolaDatiRicarica(r, request, boutique.getAdmin());

        ricaricaRepository.save(r);
        return toResponse(r);
    }

    private void impostaPrezzi(Ricarica r, CreaRicaricaRequest req, Operatore op, Utente admin) {
        if (req.isManuale()) {
            if (req.getCostoEffettivo() == null || req.getCostoCliente() == null) {
                throw new IllegalArgumentException("Prezzi manuali obbligatori");
            }
            r.setCostoEffettivo(req.getCostoEffettivo());
            r.setCostoCliente(req.getCostoCliente());
        } else {
            Tariffa t = tariffaService.getTariffaApplicabile(op, req.getGiga(), admin);
            r.setCostoEffettivo(t.getCostoAcquisto());
            r.setCostoCliente(t.getPrezzoVendita());
        }
        r.setProfitto(r.getCostoCliente().subtract(r.getCostoEffettivo()));
    }

    public void eliminaRicarica(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        switch (ruolo) {
            case "DIPENDENTE"  -> eliminaRicaricaDipendente(id, boutiqueId);
            case "ADMIN"       -> eliminaRicaricaAdmin(id, utenteId);
            case "SUPER_ADMIN" -> eliminaRicaricaSuperAdmin(id);
            default -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        }
    }

    public RicaricaResponse modificaRicarica(Long id, CreaRicaricaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        return switch (ruolo) {
            case "DIPENDENTE"  -> modificaRicaricaDipendente(id, request, boutiqueId);
            case "ADMIN"       -> modificaRicaricaAdmin(id, request, utenteId);
            case "SUPER_ADMIN" -> modificaRicaricaSuperAdmin(id, request);
            default -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        };
    }

    private void popolaDatiRicarica(Ricarica r, CreaRicaricaRequest request, Utente admin) {
        validaNumero(request.getNumero());
        String numPulito = request.getNumero().trim();
        Operatore operatore = assegnaOperatore(numPulito);

        r.setNumero(numPulito);
        r.setOperatore(operatore);
        r.setGiga(request.getGiga());
        r.setNote(request.getNote());

        impostaPrezzi(r, request, operatore, admin);
    }

    public List<Ricarica> getRicaricheTra(Long boutiqueId, LocalDate dal, LocalDate al) {
        return ricaricaRepository.findByBoutiqueIdAndDataSoloBetween(boutiqueId, dal, al);
    }

    private RicaricaResponse toResponse(Ricarica r) {
        return new RicaricaResponse(
                r.getId(),
                r.getDataOra(),
                r.getDataSolo(),
                r.getNumero(),
                r.getOperatore(),
                r.getGiga(),
                r.getCostoEffettivo(),
                r.getCostoCliente(),
                r.getProfitto(),
                r.getNote(),
                r.getBoutique().getId(),
                r.getBoutique().getNome()
        );
    }


    // ELIMINAZIONE

    void eliminaRicaricaDipendente(Long id, Long boutiqueId) {
        Ricarica r = ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ricarica con ID " + id + " non trovata."));
        if (!r.getBoutique().getId().equals(boutiqueId)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa ricarica.");
        }
        ricaricaRepository.deleteById(id);
    }

    void eliminaRicaricaAdmin(Long id, Long utenteId) {
        Ricarica r = ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ricarica con ID " + id + " non trovata."));
        if (!r.getBoutique().getAdmin().getId().equals(utenteId)) {
            throw new IllegalArgumentException("Non hai i permessi per eliminare questa ricarica.");
        }
        ricaricaRepository.deleteById(id);
    }

    void eliminaRicaricaSuperAdmin(Long id) {
        ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ricarica con ID " + id + " non trovata."));
        ricaricaRepository.deleteById(id);
    }

    // MODIFICA

    RicaricaResponse modificaRicaricaDipendente(Long id, CreaRicaricaRequest request, Long boutiqueId) {
        Ricarica r = ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ricarica con ID " + id + " non trovata."));
        if (!r.getBoutique().getId().equals(boutiqueId)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa ricarica.");
        }
        popolaDatiRicarica(r, request, r.getBoutique().getAdmin());
        ricaricaRepository.save(r);
        return toResponse(r);
    }

    RicaricaResponse modificaRicaricaAdmin(Long id, CreaRicaricaRequest request, Long utenteId) {
        Ricarica r = ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ricarica con ID " + id + " non trovata."));
        if (!r.getBoutique().getAdmin().getId().equals(utenteId)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa ricarica.");
        }
        popolaDatiRicarica(r, request, r.getBoutique().getAdmin());
        ricaricaRepository.save(r);
        return toResponse(r);
    }

    RicaricaResponse modificaRicaricaSuperAdmin(Long id, CreaRicaricaRequest request) {
        Ricarica r = ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ricarica con ID " + id + " non trovata."));
        popolaDatiRicarica(r, request, r.getBoutique().getAdmin());
        ricaricaRepository.save(r);
        return toResponse(r);
    }
}