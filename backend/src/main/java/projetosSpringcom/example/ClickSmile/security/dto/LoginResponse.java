package projetosSpringcom.example.ClickSmile.security.dto;

import projetosSpringcom.example.ClickSmile.domain.Perfil;

public record LoginResponse(String accessToken, String email, Perfil perfil) {
}
