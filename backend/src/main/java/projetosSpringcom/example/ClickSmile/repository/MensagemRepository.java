package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Mensagem;

import java.util.List;
import java.util.UUID;

public interface MensagemRepository extends JpaRepository<Mensagem, UUID> {
    List<Mensagem> findByRoomIdOrderBySentAtAsc(String roomId);
}
