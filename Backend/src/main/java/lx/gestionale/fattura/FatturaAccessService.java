package lx.gestionale.fattura;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.dto.CreaFatturaRequest;
import lx.gestionale.negozio.Boutique;
import lx.gestionale.negozio.BoutiqueAccessService;
import lx.gestionale.negozio.BoutiqueRepository;
import lx.gestionale.negozio.BoutiqueServizio;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FatturaAccessService {

    private final FatturaRepository fatturaRepository;
    private final BoutiqueRepository boutiqueRepository;
    private final UtenteRepository utenteRepository;
    private final BoutiqueAccessService boutiqueAccessService;

    public ContestoCreazione risolviContestoCreazione(CreaFatturaRequest request, Long utenteId, Long boutiqueId) {
        if (boutiqueId != null) {
            Boutique boutique = caricaBoutiqueAbilitata(boutiqueId);
            return new ContestoCreazione(boutique.getAdmin(), boutique);
        }

        Utente admin = utenteRepository.findById(utenteId)
                .orElseThrow(() -> new IllegalArgumentException("Admin non trovato"));

        if (request.getBoutiqueId() == null) {
            return new ContestoCreazione(admin, null);
        }

        Boutique boutique = caricaBoutiqueAbilitata(request.getBoutiqueId());
        if (!boutique.getAdmin().getId().equals(utenteId)) {
            throw new IllegalArgumentException("Non hai i permessi su questa boutique");
        }

        return new ContestoCreazione(admin, boutique);
    }

    public Fattura richiediFatturaAccessibile(Long id, Long utenteId, Long boutiqueId, String ruolo) {
        Fattura fattura = trovaFattura(id);
        verificaOwnership(fattura, utenteId, boutiqueId, ruolo);
        return fattura;
    }

    public Page<Fattura> trovaFattureAccessibili(Long utenteId, Long boutiqueId, String ruolo, Pageable pageable) {
        return switch (ruolo) {
            case "SUPER_ADMIN" -> fatturaRepository.findAll(pageable);
            case "ADMIN" -> fatturaRepository.findByAdminId(utenteId, pageable);
            case "DIPENDENTE" -> fatturaRepository.findByBoutiqueId(boutiqueId, pageable);
            default -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        };
    }

    private Boutique caricaBoutiqueAbilitata(Long boutiqueId) {
        Boutique boutique = boutiqueRepository.findById(boutiqueId)
                .orElseThrow(() -> new IllegalArgumentException("Boutique non trovata"));
        boutiqueAccessService.verificaBoutiqueAttiva(boutique);
        boutiqueAccessService.verificaServizioAbilitato(boutique, BoutiqueServizio.FATTURE);
        return boutique;
    }

    private Fattura trovaFattura(Long id) {
        return fatturaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Fattura con ID " + id + " non trovata"));
    }

    private void verificaOwnership(Fattura fattura, Long utenteId, Long boutiqueId, String ruolo) {
        if ("SUPER_ADMIN".equals(ruolo)) {
            return;
        }
        if (boutiqueId != null) {
            if (fattura.getBoutique() == null || !fattura.getBoutique().getId().equals(boutiqueId)) {
                throw new IllegalArgumentException("Non hai i permessi per accedere a questa fattura");
            }
            if (!fattura.getBoutique().getAdmin().getId().equals(fattura.getAdmin().getId())) {
                throw new IllegalStateException("Incongruenza tra boutique e admin sulla fattura: ID " + fattura.getId());
            }
        } else {
            if (!fattura.getAdmin().getId().equals(utenteId)) {
                throw new IllegalArgumentException("Non hai i permessi per accedere a questa fattura");
            }
        }
    }

    public record ContestoCreazione(Utente admin, Boutique boutique) {
    }
}
