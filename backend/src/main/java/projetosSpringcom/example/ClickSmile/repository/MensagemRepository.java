package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Mensagem;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface MensagemRepository extends JpaRepository<Mensagem, UUID> {
    List<Mensagem> findByRoomIdOrderBySentAtAsc(String roomId);

    @Query("SELECT m FROM Mensagem m WHERE m.id = :id")
    Optional<Mensagem> findById(@Param("id") UUID id);

    @Modifying
    @Query("DELETE FROM Mensagem m WHERE m.id = :id")
    void deleteById(@Param("id") UUID id);
}
