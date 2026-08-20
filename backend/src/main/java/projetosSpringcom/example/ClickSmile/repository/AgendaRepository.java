package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Agenda;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

public interface AgendaRepository extends JpaRepository<Agenda, UUID> {
    Optional<Agenda> findByDentistaUsuarioId(UUID dentistaUsuarioId);

    @Query("SELECT a FROM Agenda a WHERE a.id = :id")
    Optional<Agenda> findById(@Param("id") UUID id);

    @Modifying
    @Query("DELETE FROM Agenda a WHERE a.id = :id")
    void deleteById(@Param("id") UUID id);
}
