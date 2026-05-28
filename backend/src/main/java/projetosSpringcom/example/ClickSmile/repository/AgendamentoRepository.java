package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgendamentoRepository extends JpaRepository<Agendamento, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Agendamento a WHERE a.dentista.id = :dentistaId AND a.inicioAt = :inicioAt")
    Optional<Agendamento> findByDentistaAndInicioAtForUpdate(@Param("dentistaId") UUID dentistaId, @Param("inicioAt") OffsetDateTime inicioAt);

    // Backwards-compatible alias: older code referenced dataHora; keep an overload to avoid startup errors.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Agendamento a WHERE a.dentista.id = :dentistaId AND a.inicioAt = :dataHora")
    Optional<Agendamento> findByDentistaAndDataHoraForUpdate(@Param("dentistaId") UUID dentistaId, @Param("dataHora") OffsetDateTime dataHora);

    @Query("SELECT a FROM Agendamento a WHERE a.dentista.id = :dentistaId AND a.inicioAt >= :inicio AND a.inicioAt < :fim")
    List<Agendamento> findByDentistaIdAndDataRange(@Param("dentistaId") UUID dentistaId, @Param("inicio") OffsetDateTime inicio, @Param("fim") OffsetDateTime fim);

    @EntityGraph(attributePaths = {"paciente", "dentista"})
    List<Agendamento> findByDentistaId(UUID dentistaId);

    @EntityGraph(attributePaths = {"paciente", "dentista"})
    List<Agendamento> findByPacienteId(UUID pacienteId);
}