package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.security.TenantContext;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import org.springframework.transaction.support.TransactionTemplate;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("prod")

public class ConcurrentTenantIT extends BaseIntegrationTest {

    @Autowired
    private PacienteRepository pacienteRepository;

    private UUID tenantA = UUID.fromString("aaaaaaaa-0000-0000-0000-000000000001");
    private UUID tenantB = UUID.fromString("bbbbbbbb-0000-0000-0000-000000000002");

    @Autowired
    private TransactionTemplate transactionTemplate;

    @BeforeEach
    public void setup() {
        TenantContext.clear();
    }

    @AfterEach
    public void cleanup() {
        TenantContext.clear();
    }

    @Test
    public void testHighConcurrencyTenantIsolation() throws InterruptedException {
        System.out.println("========== TESTE CONCORRÊNCIA MASSIÇA ==========");

        int threads = 50;
        ExecutorService executor = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(threads);
        
        AtomicInteger failures = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final boolean isTenantA = (i % 2 == 0);
            executor.submit(() -> {
                try {
                    UUID myTenant = isTenantA ? tenantA : tenantB;
                    TenantContext.setTenantId(myTenant);
                    
                    transactionTemplate.executeWithoutResult(status -> {
                        // Acessa o banco (forçando uso do HikariCP e do Aspect)
                        List<Paciente> pacientes = pacienteRepository.findAll();
                        
                        // Verifica se recebemos apenas os pacientes do nosso Tenant
                        boolean allMatch = pacientes.stream().allMatch(p -> p.getTenantId().equals(myTenant));
                        if (!allMatch) {
                            System.err.println("VAZAMENTO DETECTADO PARA TENANT: " + myTenant);
                            failures.incrementAndGet();
                        }
                    });
                    
                } catch (Exception e) {
                    e.printStackTrace();
                    failures.incrementAndGet();
                } finally {
                    TenantContext.clear();
                    latch.countDown();
                }
            });
        }

        boolean completed = latch.await(30, TimeUnit.SECONDS);
        assertTrue(completed, "O teste não concluiu a tempo");
        assertEquals(0, failures.get(), "Houve falhas ou vazamentos no teste de concorrência massiça!");

        System.out.println("Teste de concorrência passou sem vazamento de pool!");
        System.out.println("================================================");
    }
}

