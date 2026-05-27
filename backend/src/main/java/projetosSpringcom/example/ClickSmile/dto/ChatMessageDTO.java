package projetosSpringcom.example.ClickSmile.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ChatMessageDTO(
        UUID id,
        String roomId,
        UUID senderId,
        String senderName,
        UUID recipientId,
        String message,
        OffsetDateTime sentAt
) {}
