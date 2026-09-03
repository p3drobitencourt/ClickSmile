package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Dentista;

import java.util.UUID;

public interface DentistaRepository extends JpaRepository<Dentista, UUID> {
    boolean existsByCro(String cro);
}
