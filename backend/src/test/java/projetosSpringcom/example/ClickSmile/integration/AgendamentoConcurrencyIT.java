package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
// Removed Testcontainers imports
// Removed unused domain/repository imports
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.service.AgendamentoConflictException;
import projetosSpringcom.example.ClickSmile.service.AgendamentoService;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
    "spring.datasource.username=postgres.vlgfqocctzicdpcwhhyr",
    "spring.datasource.password=e!qN4k+f*H*x8Mt",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.flyway.enabled=true"
})
public class AgendamentoConcurrencyIT {
// Testcontainers removed. Using external DB provided by environment.

    @Autowired
    private AgendamentoService agendamentoService;

// Removed unused repositories

    @Test
    public void testConcurrencyOnAgendamento() throws InterruptedException {
        // Prepare data using V7 static mock UUIDs
        UUID dentistaId = UUID.fromString("d1000000-0000-0000-0000-000000000001");
        UUID paciente1Id = UUID.fromString("c1000000-0000-0000-0000-000000000001");
        UUID paciente2Id = UUID.fromString("c2000000-0000-0000-0000-000000000002");

        OffsetDateTime dataHora = java.time.OffsetDateTime.of(2026, 11, 23, 10, 0, 0, 0, java.time.ZoneOffset.of("-03:00")); // 23 de Novembro de 2026 é Segunda-feira
        
        AgendamentoRequestDTO req1 = new AgendamentoRequestDTO(paciente1Id, dentistaId, dataHora);
        AgendamentoRequestDTO req2 = new AgendamentoRequestDTO(paciente2Id, dentistaId, dataHora);

        int threads = 2;
        ExecutorService executorService = Executors.newFixedThreadPool(threads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch done = new CountDownLatch(threads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        Runnable task1 = () -> {
            try {
                latch.await();
                agendamentoService.criar(req1);
                successCount.incrementAndGet();
            } catch (AgendamentoConflictException e) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                // ignore
            } finally {
                done.countDown();
            }
        };

        Runnable task2 = () -> {
            try {
                latch.await();
                agendamentoService.criar(req2);
                successCount.incrementAndGet();
            } catch (AgendamentoConflictException e) {
                conflictCount.incrementAndGet();
            } catch (Exception e) {
                // ignore
            } finally {
                done.countDown();
            }
        };

        executorService.submit(task1);
        executorService.submit(task2);

        // Start both simultaneously
        latch.countDown();
        done.await();

        assertEquals(1, successCount.get(), "Apenas um agendamento deve ter sucesso");
        assertEquals(1, conflictCount.get(), "O outro agendamento deve dar erro de conflito (409)");
    }
}
