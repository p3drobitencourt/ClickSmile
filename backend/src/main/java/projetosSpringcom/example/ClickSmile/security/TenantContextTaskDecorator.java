package projetosSpringcom.example.ClickSmile.security;

import org.springframework.core.task.TaskDecorator;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.UUID;

public class TenantContextTaskDecorator implements TaskDecorator {

    @Override
    public Runnable decorate(Runnable runnable) {
        UUID tenantId = TenantContext.getTenantId();
        SecurityContext securityContext = SecurityContextHolder.getContext();
        
        return () -> {
            try {
                if (tenantId != null) {
                    TenantContext.setTenantId(tenantId);
                }
                if (securityContext != null) {
                    SecurityContextHolder.setContext(securityContext);
                }
                runnable.run();
            } finally {
                TenantContext.clear();
                SecurityContextHolder.clearContext();
            }
        };
    }
}