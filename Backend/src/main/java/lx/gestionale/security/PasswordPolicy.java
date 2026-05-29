package lx.gestionale.security;

import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;

@Component
public class PasswordPolicy {

    private static final int MIN_PASSWORD_LENGTH = 8;
    private static final int MAX_BCRYPT_PASSWORD_BYTES = 72;

    public void validaNuovaPassword(String password) {
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException("Password obbligatoria");
        }
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalArgumentException("La password deve avere almeno " + MIN_PASSWORD_LENGTH + " caratteri");
        }
        if (password.getBytes(StandardCharsets.UTF_8).length > MAX_BCRYPT_PASSWORD_BYTES) {
            throw new IllegalArgumentException("La password non puo superare " + MAX_BCRYPT_PASSWORD_BYTES + " byte");
        }
    }
}
