package lx.gestionale.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import lx.gestionale.utente.Utente;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiration}")
    private long expiration;

    public String generaToken(String username, Long utenteId, Long boutiqueId, String ruolo) {
        return Jwts.builder()
                .subject(username)
                .claim("ruolo", ruolo)
                .claim("boutiqueId", boutiqueId)
                .claim("utenteId", utenteId)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getChiave())
                .compact();
    }

    public String estraiUsername(String token) {
        return estraiClaim(token, Claims::getSubject);
    }

    public boolean isTokenValido(String token, String username) {
        return estraiUsername(token).equals(username) && !isTokenScaduto(token);
    }

    private boolean isTokenScaduto(String token) {
        return estraiClaim(token, Claims::getExpiration).before(new Date());
    }

    private <T> T estraiClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(estraiTuttiClaims(token));
    }

    private Claims estraiTuttiClaims(String token) {
        return Jwts.parser()
                .verifyWith(getChiave())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private SecretKey getChiave() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }
}