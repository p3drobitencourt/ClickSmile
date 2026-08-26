package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;

public record ClinicaPublicResumoDTO(
        UUID id,
        String nomeFantasia,
        String cnpj
) {}
