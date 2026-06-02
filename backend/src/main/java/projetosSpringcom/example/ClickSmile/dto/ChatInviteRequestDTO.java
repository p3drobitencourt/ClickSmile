package projetosSpringcom.example.ClickSmile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public record ChatInviteRequestDTO(
        @NotBlank String roomId,
        @NotNull UUID dentistaId,
        @NotBlank String dentistaNome,
        @NotNull UUID clienteId,
        @NotNull OffsetDateTime dataHora
) {}
