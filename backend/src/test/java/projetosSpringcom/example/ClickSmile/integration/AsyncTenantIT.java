package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import projetosSpringcom.example.ClickSmile.security.TenantContext;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutionException;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("prod")

public class AsyncTenantIT extends BaseIntegrationTest {

    @Autowired
    private AsyncTestService asyncTestService;

    private UUID tenantA = UUID.fromString("aaaaaaaa-0000-0000-0000-000000000001");
    private UUID tenantB = UUID.fromString("bbbbbbbb-0000-0000-0000-000000000002");

    @BeforeEach
    public void setup() {
        TenantContext.clear();
    }

    @AfterEach
    public void cleanup() {
        TenantContext.clear();
    }

    @Test
    public void testAsyncTenantPropagation() throws ExecutionException, InterruptedException {
        System.out.println("========== TESTE ASYNC TENANT PROPAGATION ==========");

        // Define o tenant na thread principal
        TenantContext.setTenantId(tenantA);

        // Dispara tarefa assíncrona
        CompletableFuture<UUID> asyncResultA = asyncTestService.getTenantIdAsync();
        
        // Verifica se a thread assíncrona recebeu o tenant corretamente
        assertEquals(tenantA, asyncResultA.get(), "O tenant A deve ser propagado para a thread assíncrona.");

        // Troca para o Tenant B na thread principal
        TenantContext.setTenantId(tenantB);

        // Dispara nova tarefa assíncrona
        CompletableFuture<UUID> asyncResultB = asyncTestService.getTenantIdAsync();

        // Verifica se a thread assíncrona recebeu o tenant B corretamente
        assertEquals(tenantB, asyncResultB.get(), "O tenant B deve ser propagado para a thread assíncrona.");

        System.out.println("Propagação assíncrona (TaskDecorator) funcionou com sucesso!");
        System.out.println("====================================================");
    }
}

