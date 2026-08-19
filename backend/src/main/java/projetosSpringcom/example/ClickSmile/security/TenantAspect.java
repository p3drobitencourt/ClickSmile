package projetosSpringcom.example.ClickSmile.security;

import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Aspect
@Component
public class TenantAspect {

    private final EntityManager entityManager;

    public TenantAspect(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Before("@annotation(org.springframework.transaction.annotation.Transactional) || @within(org.springframework.transaction.annotation.Transactional)")
    public void setTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        System.out.println("ASPECT EXECUTING WITH TENANT: " + tenantId);
        if (tenantId != null) {
            Session session = entityManager.unwrap(Session.class);
            // Defesa Nível 2: JPA Filters
            session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);

            // Defesa Nível 1: RLS (PostgreSQL SET LOCAL)
            entityManager.createNativeQuery("SET LOCAL app.tenant_id = :tenantId")
                    .setParameter("tenantId", tenantId.toString())
                    .executeUpdate();
        } else {
            // Em caso de chamadas assíncronas ou de sistema sem tenant
            // limpamos explicitamente para garantir vazamento zero de pool
            entityManager.createNativeQuery("SET LOCAL app.tenant_id = ''")
                    .executeUpdate();
        }
    }
}