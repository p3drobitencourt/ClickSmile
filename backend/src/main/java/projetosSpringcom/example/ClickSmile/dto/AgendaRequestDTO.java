package projetosSpringcom.example.ClickSmile.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record AgendaRequestDTO(
        @NotNull UUID dentistaId,
        @NotBlank String timezone,
        @NotNull Integer slotDurationMin,
        @NotNull LocalTime horaInicioPadrao,
        @NotNull LocalTime horaFimPadrao,
        @NotNull @Valid List<RegraHorarioDTO> regras
) {}
