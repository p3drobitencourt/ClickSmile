package projetosSpringcom.example.ClickSmile.dto;

import java.time.OffsetDateTime;
import java.util.UUID;
import projetosSpringcom.example.ClickSmile.domain.StatusAgendamento;

public record AgendamentoResponseDTO(
        UUID id,
        UUID pacienteId,
        String pacienteNome,
        UUID dentistaId,
        String dentistaNome,
        OffsetDateTime inicioAt,
        OffsetDateTime fimAt,
        StatusAgendamento status,
        String observacoes
) {}
