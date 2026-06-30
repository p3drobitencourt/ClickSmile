package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmail(String email);
    Optional<Usuario> findByTenantIdAndEmail(UUID tenantId, String email);
    long countByPerfil(Perfil perfil);
    List<Usuario> findByPerfil(Perfil perfil);

    @Query(value = "SELECT CAST(d.id AS varchar) as id, u.nome as nome, u.email as email, d.cro as cro, d.especialidade as especialidade, tc.latitude as latitude, tc.longitude as longitude, " +
                   "(6371 * acos(cos(radians(:lat)) * cos(radians(tc.latitude)) * cos(radians(tc.longitude) - radians(:lng)) + sin(radians(:lat)) * sin(radians(tc.latitude)))) AS distanciaKm " +
                   "FROM dentista d " +
                   "JOIN usuario u ON d.id = u.id " +
                   "JOIN tenant_clinica tc ON u.tenant_id = tc.id " +
                   "WHERE u.perfil = 'DENTISTA' AND tc.latitude IS NOT NULL AND tc.longitude IS NOT NULL " +
                   "ORDER BY distanciaKm ASC", nativeQuery = true)
    List<Object[]> findDentistasProximos(@Param("lat") double lat, @Param("lng") double lng);
}