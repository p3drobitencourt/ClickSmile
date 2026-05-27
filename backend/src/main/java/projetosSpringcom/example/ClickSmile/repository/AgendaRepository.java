package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Agenda;

import java.util.Optional;
import java.util.UUID;

public interface AgendaRepository extends JpaRepository<Agenda, UUID> {
    Optional<Agenda> findByDentistaUsuarioId(UUID dentistaUsuarioId);
}
