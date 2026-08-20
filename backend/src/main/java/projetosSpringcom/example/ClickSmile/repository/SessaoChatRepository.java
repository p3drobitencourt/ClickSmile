package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.SessaoChat;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;

public interface SessaoChatRepository extends JpaRepository<SessaoChat, UUID> {
    Optional<SessaoChat> findByClienteIdAndDentistaId(UUID clienteId, UUID dentistaId);

    @Query("SELECT s FROM SessaoChat s WHERE s.id = :id")
    Optional<SessaoChat> findById(@Param("id") UUID id);

    @Modifying
    @Query("DELETE FROM SessaoChat s WHERE s.id = :id")
    void deleteById(@Param("id") UUID id);
}
