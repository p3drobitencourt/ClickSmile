package projetosSpringcom.example.ClickSmile.dto;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record AgendaResponseDTO(
        UUID id,
        UUID dentistaId,
        String timezone,
        Integer slotDurationMin,
        LocalTime horaInicioPadrao,
        LocalTime horaFimPadrao,
        List<RegraHorarioDTO> regras,
        boolean ativo
) {}
