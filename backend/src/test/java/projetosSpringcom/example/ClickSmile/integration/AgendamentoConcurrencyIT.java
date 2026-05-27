package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.service.AgendamentoConflictException;
import projetosSpringcom.example.ClickSmile.service.AgendamentoService;

import java.time.OffsetDateTime;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class AgendamentoConcurrencyIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "update");
    }

    @Autowired
    private AgendamentoService agendamentoService;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Test
    public void testConcurrencyOnAgendamento() throws InterruptedException {
        // Prepare data
        UUID tenantId = UUID.randomUUID();
        
        Dentista dentista = new Dentista();
        dentista.setEmail("dentista" + UUID.randomUUID() + "@teste.com");
        dentista.setSenha("123456");
        dentista.setTenantId(tenantId);
        dentista.setPerfil(Perfil.DENTISTA);
        dentista.setNome("Dr. Teste");
        dentista.setCro("12345");
        dentista = usuarioRepository.save(dentista);

        Paciente paciente1 = new Paciente();
        paciente1.setNome("Paciente 1");
        paciente1.setEmail("paciente1" + UUID.randomUUID() + "@teste.com");
        paciente1.setTelefone("111111111");
        paciente1.setTenantId(tenantId);
        paciente1 = pacienteRepository.save(paciente1);

        Paciente paciente2 = new Paciente();
        paciente2.setNome("Paciente 2");
        paciente2.setEmail("paciente2" + UUID.randomUUID() + "@teste.com");
        paciente2.setTelefone("222222222");
        paciente2.setTenantId(tenantId);
        paciente2 = pacienteRepository.save(paciente2);

        OffsetDateTime dataHora = OffsetDateTime.now().plusDays(1).withHour(10).withMinute(0).withSecond(0).withNano(0);
        
        AgendamentoRequestDTO req1 = new AgendamentoRequestDTO(paciente1.getId(), dentista.getId(), dataHora);
        AgendamentoRequestDTO req2 = new AgendamentoRequestDTO(paciente2.getId(), dentista.getId(), dataHora);

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
