package lx.gestionale.utente;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.CreaAdminRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UtenteService {

    private final UtenteRepository utenteRepository;
    private final PasswordEncoder passwordEncoder;

    // ── SUPER_ADMIN ───────────────────────────────────────────────────────────

    public void creaAdmin(CreaAdminRequest request) {
        verificaUsernameDisponibile(request.getUsername());

        utenteRepository.save(
                buildUtente(request.getNome(), request.getUsername(), request.getPassword())
        );
    }

    // ── Privati ───────────────────────────────────────────────────────────────

    private Utente buildUtente(String nome, String username, String password) {
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