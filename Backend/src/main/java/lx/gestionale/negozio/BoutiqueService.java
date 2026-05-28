package lx.gestionale.negozio;

import lombok.RequiredArgsConstructor;
import lx.gestionale.negozio.dto.BoutiqueResponse;
import lx.gestionale.negozio.dto.BoutiqueServiziResponse;
import lx.gestionale.negozio.dto.CreaBoutiqueRequest;
import lx.gestionale.negozio.dto.ModificaBoutiqueRequest;
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
    private final BoutiqueAccessService boutiqueAccessService;

    // ── ADMIN ─────────────────────────────────────────────────────────────────

    @Transactional
    public void creaBoutique(CreaBoutiqueRequest request, String usernameAdmin) {
        Utente admin = trovaAdmin(usernameAdmin);
        String nome = normalizza(request.getNome());
        String città = normalizza(request.getCittà());

        verificaNomeDisponibile(nome, admin);
        verificaUsernameDisponibile(request.getUsernameAccount());

        Boutique boutique = new Boutique();
        boutique.setNome(nome);
        boutique.setCittà(città);
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
    public BoutiqueResponse getBoutiqueById(Long boutiqueId, Long utenteId, String ruolo, Long boutiqueIdJwt) {
        return toResponse(boutiqueAccessService.richiediBoutiqueAccessibile(boutiqueId, utenteId, boutiqueIdJwt, ruolo));
    }

    @Transactional
    public BoutiqueResponse modificaBoutique(Long boutiqueId, ModificaBoutiqueRequest request, Long utenteId, String ruolo) {
        Boutique boutique = boutiqueAccessService.richiediBoutiqueAccessibile(boutiqueId, utenteId, null, ruolo);
        String nome = normalizza(request.getNome());
        String città = normalizza(request.getCittà());

        verificaNomeDisponibilePerModifica(nome, boutique);

        boutique.setNome(nome);
        boutique.setCittà(città);
        return toResponse(boutique);
    }

    @Transactional
    public BoutiqueResponse modificaStatoBoutique(Long boutiqueId, boolean attiva, Long adminId) {
        Boutique boutique = boutiqueAccessService.richiediBoutiqueDellAdmin(boutiqueId, adminId);
        boutique.setAttiva(attiva);
        return toResponse(boutique);
    }

    // ── Privati ───────────────────────────────────────────────────────────────

    @Transactional
    public BoutiqueResponse modificaServizioBoutique(Long boutiqueId, BoutiqueServizio servizio, boolean abilitato, Long adminId) {
        Boutique boutique = boutiqueAccessService.richiediBoutiqueDellAdmin(boutiqueId, adminId);
        boutique.impostaServizioAbilitato(servizio, abilitato);
        return toResponse(boutique);
    }

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

    private void verificaNomeDisponibilePerModifica(String nome, Boutique boutique) {
        if (boutiqueRepository.existsByNomeAndAdminIdAndIdNot(nome, boutique.getAdmin().getId(), boutique.getId())) {
            throw new IllegalArgumentException("Hai già una boutique con questo nome: " + nome);
        }
    }

    private void verificaUsernameDisponibile(String username) {
        if (utenteRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username già in uso: " + username);
        }
    }

    @Transactional
    public void impostaFattureAbilitate(Long boutiqueId, boolean abilitato, Long adminId) {
        modificaServizioBoutique(boutiqueId, BoutiqueServizio.FATTURE, abilitato, adminId);
    }

    private String normalizza(String valore) {
        return valore == null ? null : valore.trim();
    }

    private BoutiqueResponse toResponse(Boutique b) {
        return new BoutiqueResponse(
                b.getId(),
                b.getNome(),
                b.getCittà(),
                b.isRicaricheAbilitate(),
                b.isFattureAbilitate(),
                b.isAttiva(),
                new BoutiqueServiziResponse(
                        b.isRicaricheAbilitate(),
                        b.isFattureAbilitate()
                )
        );
    }
}
