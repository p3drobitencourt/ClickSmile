package projetosSpringcom.example.ClickSmile.security;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    List<RefreshToken> findByUsuarioIdAndRevokedFalse(UUID usuarioId);
}
