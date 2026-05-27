package projetosSpringcom.example.ClickSmile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ChatMessageRequestDTO(
        @NotBlank String roomId,
        @NotNull UUID senderId,
        @NotBlank String senderName,
        @NotNull UUID recipientId,
        @NotBlank String message,
        @NotNull OffsetDateTime sentAt
) {}
