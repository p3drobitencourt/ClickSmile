package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;

public record DentistaResumoDTO(
        UUID id,
        String nome,
        String email,
        String cro,
        String especialidade,
        String agendaResumo
) {}
