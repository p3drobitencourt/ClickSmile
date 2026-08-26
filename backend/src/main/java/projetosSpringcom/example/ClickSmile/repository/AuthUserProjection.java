package projetosSpringcom.example.ClickSmile.repository;

import java.util.UUID;

public interface AuthUserProjection {
    UUID getId();
    String getEmail();
    String getSenhaHash();
    UUID getTenantId();
    String getPerfil();
    String getStatus();
}
