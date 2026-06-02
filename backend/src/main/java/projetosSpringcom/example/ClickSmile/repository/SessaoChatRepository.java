package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.SessaoChat;

import java.util.Optional;
import java.util.UUID;

public interface SessaoChatRepository extends JpaRepository<SessaoChat, UUID> {
    Optional<SessaoChat> findByClienteIdAndDentistaId(UUID clienteId, UUID dentistaId);
}
