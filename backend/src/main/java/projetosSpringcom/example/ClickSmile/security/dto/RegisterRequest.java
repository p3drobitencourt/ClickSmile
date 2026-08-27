package projetosSpringcom.example.ClickSmile.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import projetosSpringcom.example.ClickSmile.domain.Perfil;

import jakarta.validation.constraints.Pattern;

public record RegisterRequest(
        @NotNull Perfil perfil,
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotBlank @Size(min = 6) String senha,
        @Pattern(regexp = "^$|^\\d{10,11}$", message = "Telefone deve conter apenas números e ter entre 10 e 11 dígitos") String telefone,
        String cro,
        String especialidade,
        String nomeClinica,
        @Pattern(regexp = "^$|^\\d{14}$", message = "CNPJ deve conter 14 dígitos numéricos") String cnpj,
        java.util.UUID tenantId,
        @Pattern(regexp = "^$|^\\d{11}$", message = "CPF deve conter 11 dígitos numéricos") String cpf
) {
}
