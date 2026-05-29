package lx.gestionale.security;

import lombok.RequiredArgsConstructor;
import lx.gestionale.security.dto.LoginRequest;
import lx.gestionale.security.dto.LoginResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
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
            String token = jwtService.generaToken(
                    principal.getUsername(),
                    principal.getUtenteId(),
                    principal.getBoutiqueId(),
                    ruolo,
                    principal.getTokenVersion()
            );
            return new LoginResponse(token, principal.getUsername(), ruolo, principal.getBoutiqueId());
        } catch (DisabledException e) {
            throw new IllegalArgumentException("Account o boutique disattivati");
        } catch (AuthenticationException e) {
            throw new IllegalArgumentException("Credenziali non valide");
        }
    }
}
