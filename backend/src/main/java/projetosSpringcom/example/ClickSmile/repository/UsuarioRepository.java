package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import java.util.Optional;
import java.util.UUID;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {
    Optional<Usuario> findByEmail(String email);
}