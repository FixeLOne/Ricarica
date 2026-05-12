package lx.gestionale.negozio;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaBoutiqueRequest;
import lx.gestionale.utente.Ruolo;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

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
        boutiqueRepository.save(boutique);

        utenteRepository.save(buildAccount(request, boutique));
    }

    public List<Boutique> getBoutiqueDelAdmin(String usernameAdmin) {
        return boutiqueRepository.findByAdmin(trovaAdmin(usernameAdmin));
    }

    // ── SUPER_ADMIN ───────────────────────────────────────────────────────────

    public List<Boutique> getTutteLeBoutique() {
        return boutiqueRepository.findAll();
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
}