package lx.gestionale.utente;

import lombok.RequiredArgsConstructor;
import lx.gestionale.fattura.contatore.ContatoreFatturaService;
import lx.gestionale.security.PasswordPolicy;
import lx.gestionale.utente.dto.CreaAdminRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UtenteService {

    private final UtenteRepository utenteRepository;
    private final PasswordEncoder passwordEncoder;
    private final ContatoreFatturaService contatoreFatturaService;
    private final PasswordPolicy passwordPolicy;

    // ── SUPER_ADMIN ───────────────────────────────────────────────────────────

    public void creaAdmin(CreaAdminRequest request) {
        verificaUsernameDisponibile(request.getUsername());
        Utente admin = utenteRepository.save(buildUtente(request.getNome(), request.getUsername(), request.getPassword()));
        contatoreFatturaService.inizializzaContatore(admin);
    }

    // ── Privati ───────────────────────────────────────────────────────────────

    private Utente buildUtente(String nome, String username, String password) {
        passwordPolicy.validaNuovaPassword(password);
        Utente utente = new Utente();
        utente.setNome(nome);
        utente.setUsername(username);
        utente.setPassword(passwordEncoder.encode(password));
        utente.setRuolo(Ruolo.ADMIN);
        return utente;
    }

    private void verificaUsernameDisponibile(String username) {
        if (utenteRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("Username già in uso: " + username);
        }
    }
}
