package projetosSpringcom.example.ClickSmile.integration;

import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import projetosSpringcom.example.ClickSmile.security.TenantContext;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

@Service
public class AsyncTestService {

    @Async
    public CompletableFuture<UUID> getTenantIdAsync() {
        // Return the current tenant ID captured inside the async thread
        return CompletableFuture.completedFuture(TenantContext.getTenantId());
    }
}
