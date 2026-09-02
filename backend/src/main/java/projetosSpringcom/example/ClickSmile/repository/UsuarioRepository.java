package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    
    @Query("SELECT u FROM Usuario u WHERE u.id = :id")
    Optional<Usuario> findById(@Param("id") UUID id);

    @Modifying
    @Query("DELETE FROM Usuario u WHERE u.id = :id")
    void deleteById(@Param("id") UUID id);

    Optional<Usuario> findByEmail(String email);

    @Query(
        nativeQuery = true,
        value = """
            SELECT
                id,
                email,
                senha_hash AS "senhaHash",
                tenant_id AS "tenantId",
                perfil,
                status
            FROM public.get_auth_user_by_email(CAST(:email AS CITEXT))
            """
    )
    Optional<AuthUserProjection> findAuthUserByEmail(@Param("email") String email);

    Optional<Usuario> findByTenantIdAndEmail(UUID tenantId, String email);
    long countByPerfil(Perfil perfil);
    List<Usuario> findByPerfil(Perfil perfil);

}