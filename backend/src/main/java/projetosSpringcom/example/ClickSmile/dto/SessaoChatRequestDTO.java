package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;

public record SessaoChatRequestDTO(
        UUID clienteId,
        UUID dentistaId
) {}
