package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import projetosSpringcom.example.ClickSmile.dto.ChatMessageDTO;
import projetosSpringcom.example.ClickSmile.dto.ChatMessageRequestDTO;

import java.util.UUID;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    @MessageMapping("/chat.send")
    public void send(@Valid ChatMessageRequestDTO request) {
        ChatMessageDTO response = new ChatMessageDTO(
            UUID.randomUUID(),
            request.roomId(),
            request.senderId(),
            request.senderName(),
            request.recipientId(),
            request.message(),
            request.sentAt()
        );

        messagingTemplate.convertAndSend("/topic/chat." + request.roomId(), response);
    }
}
