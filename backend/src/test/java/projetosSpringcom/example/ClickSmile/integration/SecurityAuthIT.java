package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("test")
public class SecurityAuthIT {

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
    private MockMvc mockMvc;

    @Test
    public void testPublicEndpointIsAccessibleWithoutAuth() throws Exception {
        // "/api/auth/login" is public (should return 4xx or 200, but not 401/403 for missing token if method is allowed, 
        // wait, /api/auth/** is configured to permitAll, let's try a GET that doesn't exist just to test security filter)
        mockMvc.perform(get("/api/auth/some-public-endpoint"))
               .andExpect(status().isNotFound()); // not 401
    }

    @Test
    public void testProtectedEndpointReturnsUnauthorized() throws Exception {
        // "/api/usuarios/me" is protected
        mockMvc.perform(get("/api/usuarios/me"))
               .andExpect(status().isUnauthorized()); // Without token, should be 401 Unauthorized
    }

    @Test
    public void testProtectedEndpointWithInvalidTokenReturnsUnauthorized() throws Exception {
        // Sending a forged token should result in 401
        String forgedToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.invalid_signature_here";
        
        mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + forgedToken))
               .andExpect(status().isUnauthorized());
    }
}
