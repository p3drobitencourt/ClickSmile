package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;

public record DentistaPerfilDTO(
    UUID id,
    String nome,
    String especialidade,
    String bio,
    String clinica,
    String telefone,
    String endereco
) {}
