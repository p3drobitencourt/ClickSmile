package projetosSpringcom.example.ClickSmile.security;

import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

import org.springframework.transaction.support.TransactionTemplate;

import org.springframework.core.annotation.Order;

@Aspect
@Component
@Order(1)
public class TenantAspect {

    private final EntityManager entityManager;
    private final TransactionTemplate transactionTemplate;

    public TenantAspect(EntityManager entityManager, TransactionTemplate transactionTemplate) {
        this.entityManager = entityManager;
        this.transactionTemplate = transactionTemplate;
    }

    @Before("execution(* projetosSpringcom.example.ClickSmile.repository..*(..)) || execution(* projetosSpringcom.example.ClickSmile.service..*(..))")
    public void setTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        System.out.println("ASPECT EXECUTING WITH TENANT: " + tenantId);
        if (tenantId != null) {
            Session session = entityManager.unwrap(Session.class);
            // Defesa Nível 2: JPA Filters
            session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);

            // Defesa Nível 1: RLS (PostgreSQL SET LOCAL) - Envolvido em transação programática se necessário
            transactionTemplate.executeWithoutResult(status -> {
                entityManager.createNativeQuery("SET LOCAL app.tenant_id = '" + tenantId.toString() + "'")
                        .executeUpdate();
            });
        } else {
            // Em caso de chamadas assíncronas ou de sistema sem tenant
            // limpamos explicitamente para garantir vazamento zero de pool
            transactionTemplate.executeWithoutResult(status -> {
                entityManager.createNativeQuery("SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000000'")
                        .executeUpdate();
            });
        }
    }
}