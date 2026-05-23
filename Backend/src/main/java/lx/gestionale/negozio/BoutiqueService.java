package lx.gestionale.negozio;

import lombok.RequiredArgsConstructor;
import lx.gestionale.negozio.dto.BoutiqueResponse;
import lx.gestionale.negozio.dto.CreaBoutiqueRequest;
import lx.gestionale.utente.Ruolo;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BoutiqueService {

    private final BoutiqueRepository boutiqueRepository;
    private final UtenteRepository utenteRepository;
    private final PasswordEncoder passwordEncoder;

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    @Transactional
    public void creaBoutique(CreaBoutiqueRequest request, String usernameAdmin) {
        Utente admin = trovaAdmin(usernameAdmin);
        verificaNomeDisponibile(request.getNome(), admin);
        verificaUsernameDisponibile(request.getUsernameAccount());

        Boutique boutique = new Boutique();
        boutique.setNome(request.getNome());
        boutique.setCittà(request.getCittà());
        boutique.setAdmin(admin);
        boutique.setFattureAbilitate(request.isFattureAbilitate());
        boutiqueRepository.save(boutique);

        utenteRepository.save(buildAccount(request, boutique));
    }

    public List<BoutiqueResponse> getBoutiqueDelAdmin(String usernameAdmin) {
        return boutiqueRepository.findByAdmin(trovaAdmin(usernameAdmin)).stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    // ── SUPER_ADMIN ───────────────────────────────────────────────────────────
    public List<BoutiqueResponse> getTutteLeBoutique() {
        return boutiqueRepository.findAll().stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public BoutiqueResponse getBoutiqueById(Long boutiqueId, Long utenteId, String ruolo) {
        Boutique boutique = boutiqueRepository.findById(boutiqueId)
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Boutique con ID " + boutiqueId + " non trovata."));

        // Protezione IDOR: Un ADMIN può vedere solo le proprie boutique.
        // Il SUPER_ADMIN e i DIPENDENTI (della specifica boutique) bypassano questo blocco.
        if ("ADMIN".equals(ruolo) && !boutique.getAdmin().getId().equals(utenteId)) {
            throw new IllegalArgumentException("Non hai i permessi per accedere a questa boutique.");
        }

        if ("DIPENDENTE".equals(ruolo)) {
            // Se in futuro si decide di estendere i permessi di lettura ai dipendenti, devono poter leggere solo la loro
            throw new IllegalArgumentException("I dipendenti non possono accedere a questa rotta.");
        }

        return toResponse(boutique);
    }

    // ── Privati ───────────────────────────────────────────────────────────────

    private Utente trovaAdmin(String username) {
        return utenteRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Admin non trovato: " + username));
    }

    private Utente buildAccount(CreaBoutiqueRequest request, Boutique boutique) {
        Utente account = new Utente();
        account.setNome(request.getNomeAccount());
        account.setUsername(request.getUsernameAccount());
        account.setPassword(passwordEncoder.encode(request.getPasswordAccount()));
        account.setRuolo(Ruolo.DIPENDENTE);
        account.setBoutique(boutique);
        return account;
    }

    private void verificaNomeDisponibile(String nome, Utente admin) {
        if (boutiqueRepository.existsByNomeAndAdmin(nome, admin)) {
            throw new IllegalArgumentException("Hai già una boutique con questo nome: " + nome);
        }
    }

    private void verificaUsernameDisponibile(String username) {
        if (utenteRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username già in uso: " + username);
        }
    }

    public void impostaFattureAbilitate(Long boutiqueId, boolean abilitato, Long adminId) {
        Boutique boutique = boutiqueRepository.findById(boutiqueId)
                .orElseThrow(() -> new IllegalArgumentException("Boutique non trovata"));
        if (!boutique.getAdmin().getId().equals(adminId)) {
            throw new IllegalArgumentException("Non hai i permessi per modificare questa boutique");
        }
        boutique.setFattureAbilitate(abilitato);
        boutiqueRepository.save(boutique);
    }

    private BoutiqueResponse toResponse(Boutique b) {
        return new BoutiqueResponse(
                b.getId(),
                b.getNome(),
                b.getCittà(),
                b.isFattureAbilitate()
        );
    }
}