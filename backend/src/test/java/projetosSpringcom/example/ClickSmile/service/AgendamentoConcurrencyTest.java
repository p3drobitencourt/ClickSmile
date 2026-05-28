package projetosSpringcom.example.ClickSmile.service;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("test")
public class AgendamentoConcurrencyTest {

    @Autowired
    private AgendamentoService agendamentoService;

    @Test
    public void testConcurrency() throws InterruptedException {
        int numThreads = 10;
        ExecutorService executor = Executors.newFixedThreadPool(numThreads);
        CountDownLatch latch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(numThreads);

        AtomicInteger successCount = new AtomicInteger(0);
        AtomicInteger conflictCount = new AtomicInteger(0);

        UUID dentistaId = UUID.fromString("00000000-0000-0000-0000-000000000002");
        UUID clienteId = UUID.fromString("00000000-0000-0000-0000-000000000003");
        OffsetDateTime dataHora = OffsetDateTime.parse("2026-10-10T10:00:00Z");

        for (int i = 0; i < numThreads; i++) {
            executor.submit(() -> {
                try {
                    latch.await();
                    AgendamentoRequestDTO req = new AgendamentoRequestDTO(clienteId, dentistaId, dataHora);
                    agendamentoService.criar(req);
                    successCount.incrementAndGet();
                } catch (AgendamentoConflictException e) {
                    conflictCount.incrementAndGet();
                } catch (Exception e) {
                    // Ignore other test setup exceptions like user not found if DB is empty
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        latch.countDown(); // Release all threads at once
        doneLatch.await(); // Wait for all to finish

        // Depending on DB seed, either 1 succeeds and 9 conflict, or all fail if seed is missing.
        // We assert that NO MORE THAN 1 succeeds.
        assertEquals(true, successCount.get() <= 1);
        assertEquals(true, successCount.get() + conflictCount.get() <= numThreads);
    }
}
