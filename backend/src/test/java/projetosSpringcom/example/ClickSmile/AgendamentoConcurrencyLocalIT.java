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
import org.springframework.test.context.ActiveProfiles;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("local")
public class AgendamentoConcurrencyLocalIT {

    @Autowired
    private TestRestTemplate rest;

    @Autowired
    private JdbcTemplate jdbc;

    @BeforeEach
    void before() {
        // Ensure a simple unique constraint exists in H2 to simulate Postgres EXCLUDE constraint
        try {
            jdbc.execute("CREATE UNIQUE INDEX IF NOT EXISTS ux_agendamento_dentista_inicio ON agendamento (dentista_usuario_id, inicio_at)");
        } catch (Exception ex) {
            // best-effort; tests can continue if DDL not supported
        }
    }

    @Test
    void when_two_simultaneous_requests_local_then_one_conflict() throws InterruptedException, ExecutionException {
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

        // Debug info
        System.out.println("r1=" + r1.getStatusCodeValue() + " body=" + r1.getBody());
        System.out.println("r2=" + r2.getStatusCodeValue() + " body=" + r2.getBody());

        int created = 0, conflicts = 0;
        if (r1.getStatusCodeValue() == 201) created++; else if (r1.getStatusCodeValue() == 409) conflicts++;
        if (r2.getStatusCodeValue() == 201) created++; else if (r2.getStatusCodeValue() == 409) conflicts++;

        org.junit.jupiter.api.Assertions.assertTrue(created == 1 && conflicts == 1,
            "Expected one 201 and one 409 but got r1=" + r1.getStatusCodeValue() + " r2=" + r2.getStatusCodeValue());
        ex.shutdownNow();
    }
}
