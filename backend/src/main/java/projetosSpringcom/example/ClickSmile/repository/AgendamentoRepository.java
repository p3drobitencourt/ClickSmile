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

public interface AgendamentoRepository extends JpaRepository<Agendamento, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM Agendamento a WHERE a.dentista.id = :dentistaId AND a.dataHora = :dataHora")
    Optional<Agendamento> findByDentistaAndDataHoraForUpdate(@Param("dentistaId") Long dentistaId, @Param("dataHora") LocalDateTime dataHora);

    List<Agendamento> findByDentistaId(Long dentistaId);
}