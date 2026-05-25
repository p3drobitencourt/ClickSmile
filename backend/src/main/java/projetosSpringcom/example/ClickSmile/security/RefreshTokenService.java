package projetosSpringcom.example.ClickSmile.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import projetosSpringcom.example.ClickSmile.domain.Usuario;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class RefreshTokenService {

    private final RefreshTokenRepository repository;
    private final PasswordEncoder encoder = new BCryptPasswordEncoder();

    @Value("${app.security.jwt.refresh-token-ttl:30d}")
    private String refreshTtl;

    public RefreshTokenService(RefreshTokenRepository repository) {
        this.repository = repository;
    }

    public String createRefreshToken(Usuario usuario, HttpServletResponse response) {
        String raw = UUID.randomUUID().toString();
        String hashed = encoder.encode(raw);
        Duration ttl = parseDuration(refreshTtl, Duration.ofDays(30));
        // revoke existing tokens for this user to enforce single active refresh token
        revokeAllForUser(usuario);
        RefreshToken entity = new RefreshToken(hashed, usuario, Instant.now().plus(ttl));
        repository.save(entity);

        Cookie cookie = new Cookie("refreshToken", raw);
        cookie.setHttpOnly(true);
        cookie.setPath("/api/auth");
        cookie.setMaxAge((int) ttl.getSeconds());
        response.addCookie(cookie);
        return raw;
    }

    public Optional<Usuario> validateAndGetUser(String rawToken) {
        return findByRaw(rawToken).map(RefreshToken::getUsuario);
    }

    public Optional<RefreshToken> findByRaw(String rawToken) {
        List<RefreshToken> all = repository.findAll();
        for (RefreshToken t : all) {
            if (!t.isRevoked() && t.getExpiresAt().isAfter(Instant.now())) {
                if (encoder.matches(rawToken, t.getTokenHash())) {
                    return Optional.of(t);
                }
            }
        }
        return Optional.empty();
    }

    public void revokeAllForUser(Usuario usuario) {
        List<RefreshToken> tokens = repository.findByUsuarioIdAndRevokedFalse(usuario.getId());
        tokens.forEach(t -> { t.setRevoked(true); });
        repository.saveAll(tokens);
    }

    public void revokeToken(RefreshToken t) {
        t.setRevoked(true);
        repository.save(t);
    }

    private Duration parseDuration(String value, Duration fallback) {
        try {
            if (value.endsWith("m")) {
                return Duration.ofMinutes(Long.parseLong(value.substring(0, value.length()-1)));
            }
            if (value.endsWith("h")) {
                return Duration.ofHours(Long.parseLong(value.substring(0, value.length()-1)));
            }
            if (value.endsWith("d")) {
                return Duration.ofDays(Long.parseLong(value.substring(0, value.length()-1)));
            }
            return Duration.parse(value);
        } catch (Exception e) {
            return fallback;
        }
    }
}
