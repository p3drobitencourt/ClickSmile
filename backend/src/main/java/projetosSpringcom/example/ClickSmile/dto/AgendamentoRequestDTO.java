package projetosSpringcom.example.ClickSmile.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

public record AgendamentoRequestDTO(
        @NotNull Long clienteId,
        @NotNull Long dentistaId,
        @NotNull @Future LocalDateTime dataHora
) {}