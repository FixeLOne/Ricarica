package lx.gestionale.negozio;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BoutiqueAccessService {

    private final BoutiqueRepository boutiqueRepository;

    public Boutique richiediBoutique(Long boutiqueId) {
        if (boutiqueId == null) {
            throw new IllegalArgumentException("Boutique obbligatoria");
        }
        return boutiqueRepository.findById(boutiqueId)
                .orElseThrow(() -> new EntityNotFoundException("Boutique con ID " + boutiqueId + " non trovata."));
    }

    public Boutique richiediBoutiqueAccessibile(Long boutiqueId, Long utenteId, Long boutiqueIdJwt, String ruolo) {
        Boutique boutique = richiediBoutique(boutiqueId);

        switch (ruolo) {
            case "SUPER_ADMIN" -> {
                return boutique;
            }
            case "ADMIN" -> {
                verificaBoutiqueDellAdmin(boutique, utenteId);
                return boutique;
            }
            case "DIPENDENTE" -> {
                if (!boutique.getId().equals(boutiqueIdJwt)) {
                    throw new IllegalArgumentException("Non hai i permessi su questa boutique");
                }
                return boutique;
            }
            default -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        }
    }

    public Boutique richiediBoutiqueOperativa(Long boutiqueId, Long utenteId, Long boutiqueIdJwt, String ruolo) {
        Boutique boutique = richiediBoutiqueAccessibile(boutiqueId, utenteId, boutiqueIdJwt, ruolo);
        verificaBoutiqueAttiva(boutique);
        return boutique;
    }

    public Boutique richiediBoutiqueDellAdmin(Long boutiqueId, Long adminId) {
        Boutique boutique = richiediBoutique(boutiqueId);
        verificaBoutiqueDellAdmin(boutique, adminId);
        return boutique;
    }

    public Long risolviFiltroBoutiqueId(Long filterBoutiqueId, Long utenteId, Long boutiqueIdJwt, String ruolo) {
        if (filterBoutiqueId == null) {
            return null;
        }
        return richiediBoutiqueAccessibile(filterBoutiqueId, utenteId, boutiqueIdJwt, ruolo).getId();
    }

    public void verificaBoutiqueDellAdmin(Boutique boutique, Long adminId) {
        if (boutique.getAdmin() == null || !boutique.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi su questa boutique");
        }
    }

    public void verificaBoutiqueAttiva(Boutique boutique) {
        if (!boutique.isAttiva()) {
            throw new IllegalArgumentException("Boutique disattivata: non può ricevere nuove operazioni");
        }
    }
}
