package projetosSpringcom.example.ClickSmile.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.stereotype.Service;
import projetosSpringcom.example.ClickSmile.domain.Usuario;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

@Service
public class JwtService {

    private final JwtEncoder jwtEncoder;

    @Value("${app.security.jwt.issuer:clicksmile}")
    private String issuer;

    @Value("${app.security.jwt.access-token-ttl:15m}")
    private String accessTtl;

    public JwtService(JwtEncoder jwtEncoder) {
        this.jwtEncoder = jwtEncoder;
    }

    public String createAccessToken(Usuario usuario) {
        Instant now = Instant.now();
        Duration ttl = parseDuration(accessTtl, Duration.ofMinutes(15));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .issuer(issuer)
                .issuedAt(now)
                .expiresAt(now.plus(ttl))
                .subject(String.valueOf(usuario.getId()))
                .claim("email", usuario.getEmail())
                .claim("roles", List.of(usuario.getPerfil().name()))
                .build();

        return this.jwtEncoder.encode(JwtEncoderParameters.from(claims)).getTokenValue();
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
