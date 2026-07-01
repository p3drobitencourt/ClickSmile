package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;

public record DentistaPerfilDTO(
    UUID id,
    String nome,
    String especialidade,
    String bio,
    String clinica,
    String telefone,
    String cep,
    String logradouro,
    String numero,
    String complemento,
    String bairro,
    String cidade,
    String estado,
    java.math.BigDecimal latitude,
    java.math.BigDecimal longitude
) {}
