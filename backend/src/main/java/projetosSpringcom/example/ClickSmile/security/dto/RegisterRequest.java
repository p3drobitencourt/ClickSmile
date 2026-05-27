package projetosSpringcom.example.ClickSmile.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import projetosSpringcom.example.ClickSmile.domain.Perfil;

public record RegisterRequest(
        @NotNull Perfil perfil,
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String senha,
        String telefone,
        String cro,
        String especialidade,
        String nomeClinica
) {
}
