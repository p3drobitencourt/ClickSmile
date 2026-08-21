package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
// Removed Testcontainers imports
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require",
    "spring.datasource.username=postgres.vlgfqocctzicdpcwhhyr",
    "spring.datasource.password=e!qN4k+f*H*x8Mt",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.flyway.enabled=true"
})
public class SecurityAuthIT {

    // Testcontainers removed. Using external DB provided by environment.

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testPublicEndpointIsAccessibleWithoutAuth() throws Exception {
        mockMvc.perform(get("/api/public/some-public-endpoint"))
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
