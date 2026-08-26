package projetosSpringcom.example.ClickSmile.security;

import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.stereotype.Component;

import java.util.UUID;



import org.springframework.core.annotation.Order;

@Aspect
@Component
@Order(1)
public class TenantAspect {

    private final EntityManager entityManager;
    public TenantAspect(EntityManager entityManager) {
        this.entityManager = entityManager;
    }

    @Before("execution(* projetosSpringcom.example.ClickSmile.repository..*(..)) || execution(* projetosSpringcom.example.ClickSmile.service..*(..))")
    public void setTenantId() {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId != null) {
            Session session = entityManager.unwrap(Session.class);
            // Defesa Nível 2: JPA Filters
            session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);

            // Defesa Nível 1: RLS (PostgreSQL SET LOCAL) na transação atual (após o start)
            session.doWork(connection -> {
                try (java.sql.Statement stmt = connection.createStatement()) {
                    stmt.execute("SET LOCAL app.tenant_id = '" + tenantId.toString() + "'");
                }
            });
        } else {
            Session session = entityManager.unwrap(Session.class);
            session.doWork(connection -> {
                try (java.sql.Statement stmt = connection.createStatement()) {
                    stmt.execute("SET LOCAL app.tenant_id = '00000000-0000-0000-0000-000000000000'");
                }
            });
        }
    }
}