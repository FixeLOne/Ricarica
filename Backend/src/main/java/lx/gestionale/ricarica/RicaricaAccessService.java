package lx.gestionale.ricarica;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class RicaricaAccessService {

    private final RicaricaRepository ricaricaRepository;

    public Ricarica richiediRicaricaPerScrittura(Long id, Long utenteId, Long boutiqueId, String ruolo, String azione) {
        Ricarica ricarica = richiediRicarica(id);

        switch (ruolo) {
            case "DIPENDENTE" -> verificaBoutiqueDipendente(ricarica, boutiqueId, azione);
            case "ADMIN" -> verificaAdminBoutique(ricarica, utenteId, azione);
            case "SUPER_ADMIN" -> {
                return ricarica;
            }
            default -> throw new IllegalArgumentException("Ruolo non riconosciuto");
        }

        return ricarica;
    }

    private Ricarica richiediRicarica(Long id) {
        return ricaricaRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Ricarica con ID " + id + " non trovata."));
    }

    private void verificaBoutiqueDipendente(Ricarica ricarica, Long boutiqueId, String azione) {
        if (!ricarica.getBoutique().getId().equals(boutiqueId)) {
            throw new IllegalArgumentException("Non hai i permessi per " + azione + " questa ricarica.");
        }
    }

    private void verificaAdminBoutique(Ricarica ricarica, Long adminId, String azione) {
        if (!ricarica.getBoutique().getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per " + azione + " questa ricarica.");
        }
    }
}
