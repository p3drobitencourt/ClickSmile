package projetosSpringcom.example.ClickSmile.security;

import java.util.UUID;

public interface TenantAware {
    UUID getTenantId();
    void setTenantId(UUID tenantId);
}
