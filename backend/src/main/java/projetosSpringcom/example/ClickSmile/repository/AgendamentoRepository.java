package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AgendamentoRepository extends JpaRepository<Agendamento, UUID> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Agendamento a WHERE a.dentista.id = :dentistaId AND a.inicioAt = :inicioAt")
    Optional<Agendamento> findByDentistaAndInicioAtForUpdate(@Param("dentistaId") UUID dentistaId, @Param("inicioAt") LocalDateTime inicioAt);

    // Backwards-compatible alias: older code referenced dataHora; keep an overload to avoid startup errors.
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Agendamento a WHERE a.dentista.id = :dentistaId AND a.inicioAt = :dataHora")
    Optional<Agendamento> findByDentistaAndDataHoraForUpdate(@Param("dentistaId") UUID dentistaId, @Param("dataHora") LocalDateTime dataHora);

    List<Agendamento> findByDentistaId(UUID dentistaId);
}