package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import java.util.Optional;
import java.util.List;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmail(String email);
    List<Usuario> findByPerfil(Perfil perfil);
}