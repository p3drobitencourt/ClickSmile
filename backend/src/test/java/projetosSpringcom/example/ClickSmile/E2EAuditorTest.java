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
import java.util.List;
import java.util.Map;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;

@TestMethodOrder(OrderAnnotation.class)
public class E2EAuditorTest {

    private static RestTemplate restTemplate;
    private static String baseUrl = "https://clicksmile-backend.onrender.com";
    private static String testUuid = UUID.randomUUID().toString().substring(0, 8);
    private static String testEmail = "dentista.e2e." + testUuid + "@e2e.local";
    private static String testPassword = "Password123!";
    private static String accessToken = null;
    private static String refreshToken = null;

    @BeforeAll
    public static void setup() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(60000);
        factory.setReadTimeout(60000);
        restTemplate = new RestTemplate(factory);
        restTemplate.getInterceptors().add((request, body, execution) -> {
            request.getHeaders().add("User-Agent", "Mozilla/5.0 ClickSmile-E2E-Auditor");
            return execution.execute(request, body);
        });
    }

    @Test
    @Order(1)
    public void test01_Register() {
        System.out.println("=== TEST 01: REGISTER ===");
        String dentistaJson = "{\"perfil\":\"DENTISTA\",\"nome\":\"Dr. E2E " + testUuid + "\",\"email\":\"" + testEmail + "\",\"senha\":\"" + testPassword + "\",\"cro\":\"CRO-E2E-" + testUuid + "\",\"especialidade\":\"E2E\",\"nomeClinica\":\"Clinica E2E " + testUuid + "\",\"cnpj\":\"CNPJ-E2E-" + testUuid + "\"}";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(dentistaJson, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/api/auth/register", request, Map.class);
        assertEquals(200, response.getStatusCode().value(), "Register should return 200 OK");
        
        Map body = response.getBody();
        assertNotNull(body, "Response body should not be null");
        assertTrue(body.containsKey("accessToken"), "Response should contain accessToken");
        assertEquals(testEmail, body.get("email"), "Email in response should match");
        
        // Extract RefreshToken from Set-Cookie header
        List<String> cookies = response.getHeaders().get(HttpHeaders.SET_COOKIE);
        assertNotNull(cookies, "Set-Cookie header should be present");
        boolean foundRefresh = false;
        for(String cookie : cookies) {
            if(cookie.contains("refreshToken=")) {
                refreshToken = cookie.split("refreshToken=")[1].split(";")[0];
                assertTrue(cookie.contains("HttpOnly"), "RefreshToken cookie must be HttpOnly");
                assertTrue(cookie.contains("Secure"), "RefreshToken cookie must be Secure");
                assertTrue(cookie.contains("SameSite=None"), "RefreshToken cookie must be SameSite=None");
                foundRefresh = true;
                break;
            }
        }
        assertTrue(foundRefresh, "RefreshToken must be present in cookies");
    }

    @Test
    @Order(2)
    public void test02_Login() {
        System.out.println("=== TEST 02: LOGIN ===");
        String loginJson = "{\"email\":\"" + testEmail + "\",\"senha\":\"" + testPassword + "\"}";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<String> request = new HttpEntity<>(loginJson, headers);

        ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/api/auth/login", request, Map.class);
        assertEquals(200, response.getStatusCode().value(), "Login should return 200 OK");
        
        Map body = response.getBody();
        assertNotNull(body);
        accessToken = (String) body.get("accessToken");
        assertNotNull(accessToken, "Access token should not be null");
        
        List<String> cookies = response.getHeaders().get(HttpHeaders.SET_COOKIE);
        assertNotNull(cookies);
        for(String cookie : cookies) {
            if(cookie.contains("refreshToken=")) {
                refreshToken = cookie.split("refreshToken=")[1].split(";")[0];
                break;
            }
        }
    }

    @Test
    @Order(3)
    public void test03_AccessProtectedEndpoint() {
        System.out.println("=== TEST 03: PROTECTED ENDPOINT ===");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        ResponseEntity<String> response = restTemplate.exchange(baseUrl + "/api/public/clinicas", HttpMethod.GET, request, String.class);
        assertEquals(200, response.getStatusCode().value(), "Protected endpoint should return 200 OK");
    }

    @Test
    @Order(4)
    public void test04_Refresh() {
        System.out.println("=== TEST 04: REFRESH TOKEN ===");
        HttpHeaders headers = new HttpHeaders();
        headers.add("Cookie", "refreshToken=" + refreshToken);
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        try {
            ResponseEntity<Map> response = restTemplate.postForEntity(baseUrl + "/api/auth/refresh", request, Map.class);
            assertEquals(200, response.getStatusCode().value(), "Refresh should return 200 OK");
            
            Map body = response.getBody();
            assertNotNull(body);
            String newAccessToken = (String) body.get("accessToken");
            assertNotNull(newAccessToken);
            assertNotEquals(accessToken, newAccessToken, "New access token should be different");
            accessToken = newAccessToken; // Save new access token
            
            String oldRefreshToken = refreshToken;
            List<String> cookies = response.getHeaders().get(HttpHeaders.SET_COOKIE);
            for(String cookie : cookies) {
                if(cookie.contains("refreshToken=")) {
                    refreshToken = cookie.split("refreshToken=")[1].split(";")[0];
                    break;
                }
            }
            assertNotEquals(oldRefreshToken, refreshToken, "New refresh token should be generated");
            
            // Try to use old refresh token (should fail)
            HttpHeaders oldHeaders = new HttpHeaders();
            oldHeaders.add("Cookie", "refreshToken=" + oldRefreshToken);
            HttpEntity<String> oldRequest = new HttpEntity<>(oldHeaders);
            assertThrows(HttpClientErrorException.Unauthorized.class, () -> {
                restTemplate.postForEntity(baseUrl + "/api/auth/refresh", oldRequest, Map.class);
            }, "Reusing old refresh token should return 401 Unauthorized");
            
        } catch (HttpClientErrorException e) {
            // Se retornar 401, falha o teste explicitamente
            fail("Refresh failed with HTTP " + e.getStatusCode() + ": " + e.getResponseBodyAsString());
        }
    }

    @Test
    @Order(5)
    public void test05_AccessProtectedEndpointWithNewToken() {
        System.out.println("=== TEST 05: PROTECTED ENDPOINT (NEW TOKEN) ===");
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(accessToken);
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        ResponseEntity<String> response = restTemplate.exchange(baseUrl + "/api/public/clinicas", HttpMethod.GET, request, String.class);
        assertEquals(200, response.getStatusCode().value(), "Protected endpoint should return 200 OK with new token");
    }

    @Test
    @Order(6)
    public void test06_Logout() {
        System.out.println("=== TEST 06: LOGOUT ===");
        HttpHeaders headers = new HttpHeaders();
        headers.add("Cookie", "refreshToken=" + refreshToken);
        HttpEntity<String> request = new HttpEntity<>(headers);
        
        ResponseEntity<Void> response = restTemplate.postForEntity(baseUrl + "/api/auth/logout", request, Void.class);
        assertEquals(204, response.getStatusCode().value(), "Logout should return 204 No Content");
        
        List<String> cookies = response.getHeaders().get(HttpHeaders.SET_COOKIE);
        boolean cookieCleared = false;
        for(String cookie : cookies) {
            if(cookie.contains("refreshToken=") && cookie.contains("Max-Age=0")) {
                cookieCleared = true;
                break;
            }
        }
        assertTrue(cookieCleared, "RefreshToken cookie must be cleared on logout");
        
        // Tentar usar o refresh token após logout
        assertThrows(HttpClientErrorException.Unauthorized.class, () -> {
            restTemplate.postForEntity(baseUrl + "/api/auth/refresh", request, Map.class);
        }, "Using refresh token after logout should return 401");
    }

    @AfterAll
    public static void cleanup() {
        System.out.println("=== CLEANUP ===");
        String dbUrl = System.getenv("SPRING_DATASOURCE_URL");
        String dbUser = System.getenv("SPRING_DATASOURCE_USERNAME");
        String dbPass = System.getenv("SPRING_DATASOURCE_PASSWORD");

        if (dbUrl != null && dbUser != null && dbPass != null) {
            try (Connection conn = DriverManager.getConnection(dbUrl, dbUser, dbPass)) {
                System.out.println("Cleaning up test data for email: " + testEmail);
                
                // Excluir refresh tokens
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM refresh_token WHERE usuario_id IN (SELECT id FROM usuario WHERE email = ?)")) {
                    ps.setString(1, testEmail);
                    ps.executeUpdate();
                }
                
                // Excluir dentista
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM dentista WHERE email = ?")) {
                    ps.setString(1, testEmail);
                    ps.executeUpdate();
                }
                
                // Excluir paciente usuario
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM paciente_usuario WHERE email = ?")) {
                    ps.setString(1, testEmail);
                    ps.executeUpdate();
                }
                
                // Excluir usuario
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM usuario WHERE email = ?")) {
                    ps.setString(1, testEmail);
                    ps.executeUpdate();
                }
                
                // Excluir tenant (cuidado com cascatas se houver, mas como criamos recém, é seguro)
                try (PreparedStatement ps = conn.prepareStatement("DELETE FROM tenant_clinica WHERE cnpj = ?")) {
                    ps.setString(1, "CNPJ-E2E-" + testUuid);
                    ps.executeUpdate();
                }
                
                System.out.println("Cleanup successful.");
            } catch (Exception e) {
                System.err.println("Cleanup failed: " + e.getMessage());
            }
        } else {
            System.out.println("Skipping cleanup: Database credentials not fully provided via ENV.");
        }
    }
}
