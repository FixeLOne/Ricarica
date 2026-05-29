package lx.gestionale.negozio;

import lombok.RequiredArgsConstructor;
import lx.gestionale.negozio.dto.BoutiqueAccountResponse;
import lx.gestionale.security.PasswordPolicy;
import lx.gestionale.utente.Ruolo;
import lx.gestionale.utente.Utente;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class BoutiqueAccountService {

    private static final int MIN_USERNAME_LENGTH = 3;
    private static final int MAX_USERNAME_LENGTH = 50;

    private final BoutiqueAccessService boutiqueAccessService;
    private final UtenteRepository utenteRepository;
    private final PasswordEncoder passwordEncoder;
    private final PasswordPolicy passwordPolicy;

    @Transactional(readOnly = true)
    public BoutiqueAccountResponse getAccount(Long boutiqueId, Long adminId) {
        Boutique boutique = boutiqueAccessService.richiediBoutiqueDellAdmin(boutiqueId, adminId);
        return toResponse(richiediAccountOperativo(boutique), boutique);
    }

    @Transactional
    public BoutiqueAccountResponse resetPassword(Long boutiqueId, String nuovaPassword, Long adminId) {
        Boutique boutique = boutiqueAccessService.richiediBoutiqueDellAdmin(boutiqueId, adminId);
        Utente account = richiediAccountOperativo(boutique);
        aggiornaPassword(account, nuovaPassword);
        revocaToken(account);
        return toResponse(account, boutique);
    }

    @Transactional
    public BoutiqueAccountResponse modificaCredenziali(Long boutiqueId, String username, String password, Long adminId) {
        Boutique boutique = boutiqueAccessService.richiediBoutiqueDellAdmin(boutiqueId, adminId);
        Utente account = richiediAccountOperativo(boutique);
        String usernameNormalizzato = normalizzaUsername(username);

        if (!Objects.equals(account.getUsername(), usernameNormalizzato)
                && utenteRepository.existsByUsernameAndIdNot(usernameNormalizzato, account.getId())) {
            throw new IllegalArgumentException("Username gia in uso: " + usernameNormalizzato);
        }

        account.setUsername(usernameNormalizzato);
        aggiornaPassword(account, password);
        revocaToken(account);
        return toResponse(account, boutique);
    }

    @Transactional
    public BoutiqueAccountResponse modificaStato(Long boutiqueId, boolean attivo, Long adminId) {
        Boutique boutique = boutiqueAccessService.richiediBoutiqueDellAdmin(boutiqueId, adminId);
        Utente account = richiediAccountOperativo(boutique);

        if (account.isAttivo() != attivo) {
            account.setAttivo(attivo);
            revocaToken(account);
        }

        return toResponse(account, boutique);
    }

    private Utente richiediAccountOperativo(Boutique boutique) {
        List<Utente> account = utenteRepository.findByBoutiqueIdAndRuolo(boutique.getId(), Ruolo.DIPENDENTE);
        if (account.isEmpty()) {
            throw new IllegalStateException("Account boutique non configurato");
        }
        if (account.size() > 1) {
            throw new IllegalStateException("Configurazione non valida: piu account dipendente per questa boutique");
        }
        return account.getFirst();
    }

    private void aggiornaPassword(Utente account, String password) {
        passwordPolicy.validaNuovaPassword(password);
        account.setPassword(passwordEncoder.encode(password));
    }

    private String normalizzaUsername(String username) {
        if (username == null) {
            throw new IllegalArgumentException("Username obbligatorio");
        }

        String normalizzato = username.trim();
        if (normalizzato.length() < MIN_USERNAME_LENGTH || normalizzato.length() > MAX_USERNAME_LENGTH) {
            throw new IllegalArgumentException(
                    "Lo username deve avere tra " + MIN_USERNAME_LENGTH + " e " + MAX_USERNAME_LENGTH + " caratteri"
            );
        }

        return normalizzato;
    }

    private void revocaToken(Utente account) {
        account.setTokenVersion(account.getTokenVersion() + 1);
    }

    private BoutiqueAccountResponse toResponse(Utente account, Boutique boutique) {
        return new BoutiqueAccountResponse(
                account.getId(),
                account.getNome(),
                account.getUsername(),
                account.isAttivo(),
                boutique.getId(),
                boutique.getNome()
        );
    }
}
