package projetosSpringcom.example.ClickSmile;

import org.junit.jupiter.api.Test;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;

import java.util.UUID;

public class E2EAuditorTest {
    @Test
    public void testFullE2E() {
        try {
            SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
            factory.setConnectTimeout(60000);
            factory.setReadTimeout(60000);
            RestTemplate restTemplate = new RestTemplate(factory);
            
            restTemplate.getInterceptors().add((request, body, execution) -> {
                request.getHeaders().add("User-Agent", "Mozilla/5.0");
                return execution.execute(request, body);
            });
            
            String baseUrl = "https://clicksmile-backend.onrender.com";

            System.out.println("\n=== ETAPA 5/6: CADASTRO E LOGIN ===");
            String email = "dentista.e2e." + UUID.randomUUID().toString().substring(0,8) + "@e2e.local";
            String dentistaJson = "{\"perfil\":\"DENTISTA\",\"nome\":\"Dr. E2E\",\"email\":\"" + email + "\",\"senha\":\"E2E123!\",\"cro\":\"CRO-E2E\",\"especialidade\":\"E2E\",\"nomeClinica\":\"Clinica E2E\",\"cnpj\":\"888888" + UUID.randomUUID().toString().substring(0,8) + "\"}";
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<String> request = new HttpEntity<>(dentistaJson, headers);

            ResponseEntity<String> registerResponse = restTemplate.postForEntity(baseUrl + "/api/auth/register", request, String.class);
            System.out.println("Register Dentista -> Status: " + registerResponse.getStatusCode());
            
            String body = registerResponse.getBody();
            String token = body.split("\"accessToken\":\"")[1].split("\"")[0];
            System.out.println("Token Obtido: " + token.substring(0, 15) + "...\n");

            System.out.println("\n=== ETAPA 7: ACESSO COM TOKEN ===");
            HttpHeaders authHeaders = new HttpHeaders();
            authHeaders.setBearerAuth(token);
            ResponseEntity<String> meResponse = restTemplate.exchange(baseUrl + "/api/public/clinicas", HttpMethod.GET, new HttpEntity<>(authHeaders), String.class);
            System.out.println("Clinicas (Public) -> Status: " + meResponse.getStatusCode());
            
        } catch (Exception e) {
            System.out.println("E2E Failed: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
