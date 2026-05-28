package lx.gestionale.security;

import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.User;

import java.util.Collection;

@Getter
public class UserPrincipal extends User {

    private final Long utenteId;
    private final Long boutiqueId;
    private final String ruolo;

    public UserPrincipal(String username, String password,
                         Collection<? extends GrantedAuthority> authorities,
                         Long utenteId, Long boutiqueId, String ruolo, boolean enabled) {
        super(username, password, enabled, true, true, true, authorities);
        this.utenteId = utenteId;
        this.boutiqueId = boutiqueId;
        this.ruolo=ruolo;
    }
}
