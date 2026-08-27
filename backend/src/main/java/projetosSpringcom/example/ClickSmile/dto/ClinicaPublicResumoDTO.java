package projetosSpringcom.example.ClickSmile.dto;

import java.util.UUID;
import java.math.BigDecimal;

public record ClinicaPublicResumoDTO(
        UUID id,
        String nomeFantasia,
        String cnpj,
        BigDecimal latitude,
        BigDecimal longitude
) {}
