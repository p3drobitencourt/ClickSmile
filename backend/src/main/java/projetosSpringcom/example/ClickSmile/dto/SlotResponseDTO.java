package projetosSpringcom.example.ClickSmile.dto;

import java.time.OffsetDateTime;

public record SlotResponseDTO(
        OffsetDateTime start,
        OffsetDateTime end,
        String title,
        String tone
) {}
