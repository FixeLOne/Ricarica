package lx.gestionale.ricarica;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import lx.gestionale.ricarica.dto.CreaRicaricaRequest;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueAccessService;
import lx.gestionale.negozio.BoutiqueServizio;
import lx.gestionale.ricarica.dto.RicaricaResponse;
import lx.gestionale.ricarica.dto.StatsOggiResponse;
import lx.gestionale.tariffa.Tariffa;
import lx.gestionale.tariffa.TariffaService;
import lx.gestionale.utente.Utente;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RicaricaService {

    private final RicaricaRepository ricaricaRepository;

    private final TariffaService tariffaService;

    private final BoutiqueAccessService boutiqueAccessService;

    private final RicaricaAccessService ricaricaAccessService;

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

    @Transactional
    public RicaricaResponse salvaRicarica(CreaRicaricaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        Boutique boutique = switch (ruolo) {
            case "DIPENDENTE" -> boutiqueAccessService.richiediBoutiqueConServizioAttivo(
                    boutiqueId, utenteId, boutiqueId, ruolo, BoutiqueServizio.RICARICHE
            );
            case "ADMIN", "SUPER_ADMIN" -> {
                if (request.getBoutiqueId() == null) {
                    throw new IllegalArgumentException("Specifica la boutique per la ricarica");
                }
                yield boutiqueAccessService.richiediBoutiqueConServizioAttivo(
                        request.getBoutiqueId(), utenteId, boutiqueId, ruolo, BoutiqueServizio.RICARICHE
                );
            }
            default -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        };

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
            if (req.getCostoEffettivo().compareTo(BigDecimal.ZERO) < 0 ||
                    req.getCostoCliente().compareTo(BigDecimal.ZERO) < 0) {
                throw new IllegalArgumentException("I prezzi manuali non possono essere negativi");
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

    @Transactional
    public void eliminaRicarica(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Ricarica ricarica = ricaricaAccessService.richiediRicaricaPerScrittura(
                id, utenteId, boutiqueId, ruolo, "eliminare"
        );
        ricarica.setEliminato(true);
    }

    @Transactional
    public RicaricaResponse modificaRicarica(Long id, CreaRicaricaRequest request, Long utenteId, Long boutiqueId, String ruolo) {
        Ricarica ricarica = ricaricaAccessService.richiediRicaricaPerScrittura(
                id, utenteId, boutiqueId, ruolo, "modificare"
        );
        popolaDatiRicarica(ricarica, request, ricarica.getBoutique().getAdmin());
        return toResponse(ricarica);
    }

    private void popolaDatiRicarica(Ricarica r, CreaRicaricaRequest request, Utente admin) {
        String numPulito = request.getNumero().trim();
        validaNumero(numPulito);
        Operatore operatore = assegnaOperatore(numPulito);

        r.setNumero(numPulito);
        r.setOperatore(operatore);
        r.setGiga(request.getGiga());
        r.setManuale(request.isManuale());
        r.setNote(request.getNote());

        impostaPrezzi(r, request, operatore, admin);
    }

    @Transactional(readOnly = true)
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
                r.isManuale(),
                r.isEliminato(),
                r.getBoutique().getId(),
                r.getBoutique().getNome()
        );
    }

    @Transactional(readOnly = true)
    public Page<RicaricaResponse> getRicariche(Long utenteId, Long boutiqueId, String ruolo, Pageable pageable, Long filterBoutiqueId) {
        Long filtroBoutiqueValidato = boutiqueAccessService.risolviFiltroBoutiqueId(filterBoutiqueId, utenteId, boutiqueId, ruolo);

        Page<Ricarica> ricariche = switch (ruolo) {
            case "SUPER_ADMIN" -> filtroBoutiqueValidato != null
                    ? ricaricaRepository.findByBoutiqueId(filtroBoutiqueValidato, pageable)
                    : ricaricaRepository.findAll(pageable);
            case "ADMIN" -> filtroBoutiqueValidato != null
                    ? ricaricaRepository.findByBoutiqueId(filtroBoutiqueValidato, pageable)
                    : ricaricaRepository.findByBoutiqueAdminId(utenteId, pageable);
            case "DIPENDENTE" -> ricaricaRepository.findByBoutiqueId(boutiqueId, pageable);
            default -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        };
        return ricariche.map(this::toResponse);
    }

    @Transactional(readOnly = true)
    public StatsOggiResponse getStatsOggi(Long utenteId, Long boutiqueId, String ruolo, Long filterBoutiqueId) {
        LocalDate oggi  = LocalDate.now();
        LocalDate ieri  = oggi.minusDays(1);
        Long filtroBoutiqueValidato = boutiqueAccessService.risolviFiltroBoutiqueId(filterBoutiqueId, utenteId, boutiqueId, ruolo);

        // Risolve su quale "asse" filtrare
        boolean perBoutique = "DIPENDENTE".equals(ruolo) || filtroBoutiqueValidato != null;
        Long bid = "DIPENDENTE".equals(ruolo) ? boutiqueId : filtroBoutiqueValidato;

        long  countOggi  = perBoutique ? ricaricaRepository.countByBoutiqueIdAndDataSolo(bid, oggi)     : ("ADMIN".equals(ruolo) ? ricaricaRepository.countByBoutiqueAdminIdAndDataSolo(utenteId, oggi)  : ricaricaRepository.countByDataSolo(oggi));
        long  countIeri  = perBoutique ? ricaricaRepository.countByBoutiqueIdAndDataSolo(bid, ieri)     : ("ADMIN".equals(ruolo) ? ricaricaRepository.countByBoutiqueAdminIdAndDataSolo(utenteId, ieri)  : ricaricaRepository.countByDataSolo(ieri));
        double gbTotali  = perBoutique ? ricaricaRepository.sumGigaByBoutiqueAndData(bid, oggi)          : ("ADMIN".equals(ruolo) ? ricaricaRepository.sumGigaByAdminAndData(utenteId, oggi)              : ricaricaRepository.sumGigaByData(oggi));
        List<Object[]> raw = perBoutique ? ricaricaRepository.countPerOperatoreByBoutiqueAndData(bid, oggi) : ("ADMIN".equals(ruolo) ? ricaricaRepository.countPerOperatoreByAdminAndData(utenteId, oggi) : ricaricaRepository.countPerOperatoreByData(oggi));

        Map<String, Long> perOperatore = raw.stream()
                .collect(Collectors.toMap(r -> ((Operatore) r[0]).name(), r -> (Long) r[1]));

        return new StatsOggiResponse(countOggi, countIeri, gbTotali, perOperatore);
    }

    //CONTATORE RICARICHE GIORNALIERO

    public long countOggi(Long utenteId, Long boutiqueId, String ruolo, Long filterBoutiqueId) {
        LocalDate oggi = LocalDate.now();
        Long filtroBoutiqueValidato = boutiqueAccessService.risolviFiltroBoutiqueId(filterBoutiqueId, utenteId, boutiqueId, ruolo);

        if ("DIPENDENTE".equals(ruolo)) {
            return ricaricaRepository.countByBoutiqueIdAndDataSolo(boutiqueId, oggi);
        } else if ("ADMIN".equals(ruolo)) {
            return filtroBoutiqueValidato != null
                    ? ricaricaRepository.countByBoutiqueIdAndDataSolo(filtroBoutiqueValidato, oggi)
                    : ricaricaRepository.countByBoutiqueAdminIdAndDataSolo(utenteId, oggi);
        } else {
            return filtroBoutiqueValidato != null
                    ? ricaricaRepository.countByBoutiqueIdAndDataSolo(filtroBoutiqueValidato, oggi)
                    : ricaricaRepository.countByDataSolo(oggi);
        }
    }
}
