package projetosSpringcom.example.ClickSmile.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.UUID;

public record AgendamentoRequestDTO(
        @NotNull UUID clienteId,
        @NotNull UUID dentistaId,
        @NotNull @Future OffsetDateTime dataHora
) {}