package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import projetosSpringcom.example.ClickSmile.domain.Mensagem;
import projetosSpringcom.example.ClickSmile.repository.MensagemRepository;
import projetosSpringcom.example.ClickSmile.dto.ChatMessageDTO;
import projetosSpringcom.example.ClickSmile.dto.ChatMessageRequestDTO;

import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MensagemRepository mensagemRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate, MensagemRepository mensagemRepository) {
        this.messagingTemplate = messagingTemplate;
        this.mensagemRepository = mensagemRepository;
    }

    @MessageMapping("/chat.send")
    public void send(@Valid ChatMessageRequestDTO request) {
        Mensagem msg = new Mensagem();
        msg.setRoomId(request.roomId());
        msg.setSenderId(UUID.fromString(request.senderId()));
        msg.setSenderName(request.senderName());
        msg.setRecipientId(UUID.fromString(request.recipientId()));
        msg.setContent(request.message());
        msg.setSentAt(request.sentAt() != null ? request.sentAt() : java.time.OffsetDateTime.now());
        
        msg = mensagemRepository.save(msg);

        ChatMessageDTO response = new ChatMessageDTO(
            msg.getId(),
            msg.getRoomId(),
            msg.getSenderId().toString(),
            msg.getSenderName(),
            msg.getRecipientId().toString(),
            msg.getContent(),
            msg.getSentAt()
        );

        messagingTemplate.convertAndSend("/topic/chat." + request.roomId(), response);
    }

    @GetMapping("/api/mensagens/historico/{roomId}")
    @ResponseBody
    public List<ChatMessageDTO> getHistorico(@PathVariable String roomId) {
        return mensagemRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
            .map(msg -> new ChatMessageDTO(
                msg.getId(),
                msg.getRoomId(),
                msg.getSenderId().toString(),
                msg.getSenderName(),
                msg.getRecipientId().toString(),
                msg.getContent(),
                msg.getSentAt()
            ))
            .collect(Collectors.toList());
    }
}
