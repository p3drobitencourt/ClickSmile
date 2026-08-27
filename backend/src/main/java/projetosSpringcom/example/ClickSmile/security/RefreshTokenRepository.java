package projetosSpringcom.example.ClickSmile.security;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    List<RefreshToken> findByUsuarioIdAndRevokedAtIsNull(UUID usuarioId);

    @org.springframework.data.jpa.repository.Query(value = "SELECT id, token_hash, tenant_id FROM public.get_all_refresh_tokens_hashes()", nativeQuery = true)
    List<Object[]> findAllHashesBypassingRls();
}
