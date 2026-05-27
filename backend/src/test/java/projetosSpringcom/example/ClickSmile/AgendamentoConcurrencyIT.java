package projetosSpringcom.example.ClickSmile;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.Map;
import java.util.HashMap;
import java.util.concurrent.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
public class AgendamentoConcurrencyIT {

    @Container
    public static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("clicksmile_test")
            .withUsername("test")
            .withPassword("test");

    @Autowired
    private TestRestTemplate rest;

    @BeforeEach
    void configure() {
        System.setProperty("spring.datasource.url", postgres.getJdbcUrl());
        System.setProperty("spring.datasource.username", postgres.getUsername());
        System.setProperty("spring.datasource.password", postgres.getPassword());
    }

    @Test
    void when_two_simultaneous_requests_then_one_conflict() throws InterruptedException, ExecutionException {
        Map<String, Object> payload = new HashMap<>();
        payload.put("dentistaId", 1);
        payload.put("pacienteId", 2);
        payload.put("dataHora", "2026-06-01T10:00:00");

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(payload, headers);

        ExecutorService ex = Executors.newFixedThreadPool(2);

        Callable<ResponseEntity<String>> call = () -> rest.postForEntity("/api/agendamentos", request, String.class);

        Future<ResponseEntity<String>> f1 = ex.submit(call);
        Future<ResponseEntity<String>> f2 = ex.submit(call);

        ResponseEntity<String> r1 = f1.get();
        ResponseEntity<String> r2 = f2.get();

        // Exactly one should be 201, one should be 409
        int created = 0, conflicts = 0;
        if (r1.getStatusCodeValue() == 201) created++; else if (r1.getStatusCodeValue() == 409) conflicts++;
        if (r2.getStatusCodeValue() == 201) created++; else if (r2.getStatusCodeValue() == 409) conflicts++;

        assert(created == 1 && conflicts == 1);
        ex.shutdownNow();
    }
}
