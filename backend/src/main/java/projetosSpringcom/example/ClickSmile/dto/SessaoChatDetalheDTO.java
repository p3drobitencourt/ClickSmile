package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;
import projetosSpringcom.example.ClickSmile.domain.SessaoChatStatus;

public record SessaoChatDetalheDTO(
        UUID id,
        UUID clienteId,
        String clienteNome,
        UUID dentistaId,
        String dentistaNome,
        SessaoChatStatus status
) {}
