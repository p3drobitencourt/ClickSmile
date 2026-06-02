package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;
import projetosSpringcom.example.ClickSmile.domain.SessaoChatStatus;

public record SessaoChatResponseDTO(
        UUID id,
        UUID clienteId,
        UUID dentistaId,
        SessaoChatStatus status
) {}
