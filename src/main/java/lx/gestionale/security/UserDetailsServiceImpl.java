package lx.gestionale.security;

import lombok.RequiredArgsConstructor;
import lx.gestionale.utente.UtenteRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UtenteRepository utenteRepository;

    @Override
    public @org.jspecify.annotations.NonNull UserDetails loadUserByUsername(@org.jspecify.annotations.NonNull String username) throws UsernameNotFoundException {
        return utenteRepository.findByUsername(username)
                .map(utente -> new UserPrincipal(
                        utente.getUsername(),
                        utente.getPassword(),
                        List.of(new SimpleGrantedAuthority("ROLE_" + utente.getRuolo().name())),
                        utente.getId(), // Passiamo l'ID dell'utente
                        utente.getBoutique() != null ? utente.getBoutique().getId() : null // Passiamo l'ID boutique
                ))
                .orElseThrow(() -> new UsernameNotFoundException("Utente non trovato: " + username));
    }
}