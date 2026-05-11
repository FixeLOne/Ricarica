package lx.gestionale.security;

import lombok.RequiredArgsConstructor;
import lx.gestionale.dto.LoginRequest;
import lx.gestionale.dto.LoginResponse;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public LoginResponse login(LoginRequest request) {
        try {
            var auth = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );
            UserPrincipal principal = (UserPrincipal) auth.getPrincipal();
            String ruolo = principal.getAuthorities().stream()
                    .findFirst()
                    .map(a -> a.getAuthority().replace("ROLE_", ""))
                    .orElseThrow(() -> new IllegalStateException("Ruolo mancante"));
            String token = jwtService.generaToken(principal.getUsername(), principal.getUtenteId(), principal.getBoutiqueId(), ruolo);
            return new LoginResponse(token, principal.getUsername(), ruolo, principal.getBoutiqueId());
        } catch (AuthenticationException e) {
            throw new IllegalArgumentException("Credenziali non valide");
        }
    }
}