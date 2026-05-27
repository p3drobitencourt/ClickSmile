package projetosSpringcom.example.ClickSmile.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalTime;

public record RegraHorarioDTO(
        @NotBlank String diaSemana,
        @NotNull Boolean ativo,
        @NotNull LocalTime inicio,
        LocalTime pausaInicio,
        LocalTime pausaFim,
        @NotNull LocalTime fim
) {}
