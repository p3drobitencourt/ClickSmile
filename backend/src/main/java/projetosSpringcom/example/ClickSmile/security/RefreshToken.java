package projetosSpringcom.example.ClickSmile.security;

import jakarta.persistence.*;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import org.hibernate.annotations.GenericGenerator;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "refresh_token")
public class RefreshToken {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String tokenHash;

    @ManyToOne
    @JoinColumn(name = "usuario_id", nullable = false)
    private Usuario usuario;

    @Column(nullable = false)
    private Instant expiresAt;

    @Column(nullable = false)
    private boolean revoked = false;

    public RefreshToken() {}

    public RefreshToken(String tokenHash, Usuario usuario, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.usuario = usuario;
        this.expiresAt = expiresAt;
    }

    public UUID getId() { return id; }
    public String getTokenHash() { return tokenHash; }
    public Usuario getUsuario() { return usuario; }
    public Instant getExpiresAt() { return expiresAt; }
    public boolean isRevoked() { return revoked; }
    public void setRevoked(boolean revoked) { this.revoked = revoked; }
}
