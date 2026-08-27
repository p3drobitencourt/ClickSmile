package projetosSpringcom.example.ClickSmile;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.junit.jupiter.api.MethodOrderer.OrderAnnotation;
import org.junit.jupiter.api.Order;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.HttpClientErrorException;

import static org.junit.jupiter.api.Assertions.*;

import java.util.UUID;
import java.util.Map;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

@TestMethodOrder(OrderAnnotation.class)
public class MultiTenantAuditorTest {

    private static RestTemplate restTemplate;
    private static String baseUrl = "https://clicksmile-backend.onrender.com";
    
    private static String uuidA = UUID.randomUUID().toString().substring(0, 8);
    private static String uuidB = UUID.randomUUID().toString().substring(0, 8);
    
    private static String emailA = "dentista.tenantA." + uuidA + "@e2e.local";
    private static String emailB = "dentista.tenantB." + uuidB + "@e2e.local";
    
    private static String tokenA;
    private static String tokenB;
    
    // Supondo que a listagem de clínicas do tenant retorna o ID, salvaremos o ID do paciente
    private static String pacienteIdA;
    private static String pacienteIdB;

    @BeforeAll
    public static void setup() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(60000);
        factory.setReadTimeout(60000);
        restTemplate = new RestTemplate(factory);
        restTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().add("User-Agent", "Mozilla/5.0 MultiTenant-E2E-Auditor");
            return execution.execute(request, body);
        });
    }

    @Test
    @Order(1)
    public void test01_RegisterTenants() {
        System.out.println("=== TEST 01: REGISTER TENANT A & B ===");
        
        // Register A
        String jsonA = "{\"perfil\":\"DENTISTA\",\"nome\":\"Dr. A\",\"email\":\"" + emailA + "\",\"senha\":\"Pass123!\",\"cro\":\"CRO-A-" + uuidA + "\",\"especialidade\":\"CLINICO\",\"nomeClinica\":\"Clinica A\",\"cnpj\":\"CNPJ-A-" + uuidA + "\"}";
        HttpHeaders headers = new HttpHeaders(); headers.setContentType(MediaType.APPLICATION_JSON);
        ResponseEntity<Map> resA = restTemplate.postForEntity(baseUrl + "/api/auth/register", new HttpEntity<>(jsonA, headers), Map.class);
        assertEquals(200, resA.getStatusCode().value());
        tokenA = (String) resA.getBody().get("accessToken");

        // Register B
        String jsonB = "{\"perfil\":\"DENTISTA\",\"nome\":\"Dr. B\",\"email\":\"" + emailB + "\",\"senha\":\"Pass123!\",\"cro\":\"CRO-B-" + uuidB + "\",\"especialidade\":\"CLINICO\",\"nomeClinica\":\"Clinica B\",\"cnpj\":\"CNPJ-B-" + uuidB + "\"}";
        ResponseEntity<Map> resB = restTemplate.postForEntity(baseUrl + "/api/auth/register", new HttpEntity<>(jsonB, headers), Map.class);
        assertEquals(200, resB.getStatusCode().value());
        tokenB = (String) resB.getBody().get("accessToken");
        
        assertNotNull(tokenA);
        assertNotNull(tokenB);
    }

    @Test
    @Order(2)
    public void test02_CreateDataInTenants() {
        System.out.println("=== TEST 02: CREATE DATA ===");
        
        // Criar paciente no Tenant A
        String pacA = "{\"nome\":\"Paciente A\",\"email\":\"pacA@e2e.local\",\"telefone\":\"11999999999\",\"cpf\":\"11111111111\",\"dataNascimento\":\"1990-01-01\"}";
        HttpHeaders headA = new HttpHeaders(); headA.setContentType(MediaType.APPLICATION_JSON); headA.setBearerAuth(tokenA);
        try {
            ResponseEntity<Map> resPacA = restTemplate.postForEntity(baseUrl + "/api/dentista/pacientes", new HttpEntity<>(pacA, headA), Map.class);
            pacienteIdA = (String) resPacA.getBody().get("id");
            assertNotNull(pacienteIdA, "Paciente A ID should not be null");
        } catch (HttpClientErrorException e) {
            fail("Failed to create Paciente A: " + e.getResponseBodyAsString());
        }

        // Criar paciente no Tenant B
        String pacB = "{\"nome\":\"Paciente B\",\"email\":\"pacB@e2e.local\",\"telefone\":\"11888888888\",\"cpf\":\"22222222222\",\"dataNascimento\":\"1990-01-01\"}";
        HttpHeaders headB = new HttpHeaders(); headB.setContentType(MediaType.APPLICATION_JSON); headB.setBearerAuth(tokenB);
        try {
            ResponseEntity<Map> resPacB = restTemplate.postForEntity(baseUrl + "/api/dentista/pacientes", new HttpEntity<>(pacB, headB), Map.class);
            pacienteIdB = (String) resPacB.getBody().get("id");
            assertNotNull(pacienteIdB, "Paciente B ID should not be null");
        } catch (HttpClientErrorException e) {
            fail("Failed to create Paciente B: " + e.getResponseBodyAsString());
        }
    }

    @Test
    @Order(3)
    public void test03_CrossTenantIsolation() {
        System.out.println("=== TEST 03: CROSS-TENANT RLS ISOLATION ===");
        
        HttpHeaders headA = new HttpHeaders(); headA.setBearerAuth(tokenA);
        HttpHeaders headB = new HttpHeaders(); headB.setBearerAuth(tokenB);

        // Acessar lista de pacientes B com Token A
        try {
            ResponseEntity<String> resListA = restTemplate.exchange(baseUrl + "/api/dentista/pacientes", HttpMethod.GET, new HttpEntity<>(headA), String.class);
            assertTrue(!resListA.getBody().contains(emailB), "Tenant A should not see Tenant B's patients in list");
        } catch(Exception e) { fail(e.getMessage()); }
        
        // Acessar ID do paciente B com Token A
        assertThrows(HttpClientErrorException.class, () -> {
            restTemplate.exchange(baseUrl + "/api/dentista/pacientes/" + pacienteIdB, HttpMethod.GET, new HttpEntity<>(headA), String.class);
        }, "Tenant A accessing Paciente B ID should fail (403/404)");

        // Acessar ID do paciente A com Token B
        assertThrows(HttpClientErrorException.class, () -> {
            restTemplate.exchange(baseUrl + "/api/dentista/pacientes/" + pacienteIdA, HttpMethod.GET, new HttpEntity<>(headB), String.class);
        }, "Tenant B accessing Paciente A ID should fail (403/404)");
    }
}
