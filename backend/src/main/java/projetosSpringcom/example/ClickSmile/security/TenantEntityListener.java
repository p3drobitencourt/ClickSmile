package projetosSpringcom.example.ClickSmile.security;

import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import java.util.UUID;

public class TenantEntityListener {

    @PrePersist
    @PreUpdate
    public void setTenantId(Object entity) {
        if (entity instanceof TenantAware) {
            UUID currentTenantId = TenantContext.getTenantId();
            if (currentTenantId != null) {
                ((TenantAware) entity).setTenantId(currentTenantId);
            } else {
                throw new IllegalStateException("Tentativa de salvar entidade protegida por Tenant sem contexto ativo.");
            }
        }
    }
}
