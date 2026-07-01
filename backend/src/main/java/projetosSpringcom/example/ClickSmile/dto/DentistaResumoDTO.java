package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;
import java.util.List;

public record DentistaResumoDTO(
        UUID id,
        String nome,
        String email,
        String cro,
        String especialidade,
        String agendaResumo,
        java.math.BigDecimal latitude,
        java.math.BigDecimal longitude,
        Double distanciaKm,
        List<SlotResponseDTO> slots
) {}
