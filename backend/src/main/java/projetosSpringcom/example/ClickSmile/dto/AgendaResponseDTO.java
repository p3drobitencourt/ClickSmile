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
) {
    public static AgendaResponseDTO empty(UUID dentistaId) {
        return new AgendaResponseDTO(
                null,
                dentistaId,
                "America/Sao_Paulo",
                30,
                LocalTime.of(8, 0),
                LocalTime.of(18, 0),
                java.util.Collections.emptyList(),
                true
        );
    }
}
