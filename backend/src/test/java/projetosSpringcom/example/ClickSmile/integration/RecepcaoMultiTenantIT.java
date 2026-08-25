package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import projetosSpringcom.example.ClickSmile.security.TenantContext;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("prod")

public class RecepcaoMultiTenantIT extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private final UUID tenantA = UUID.fromString("aaaaaaaa-0000-0000-0000-000000000001");
    private final UUID tenantB = UUID.fromString("bbbbbbbb-0000-0000-0000-000000000002");

    @BeforeEach
    public void setup() {
        TenantContext.clear();
        try {
            jdbcTemplate.update("INSERT INTO tenant_clinica (id, cnpj, razao_social, nome_fantasia) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING", 
                                tenantA, "00000000000001", "Tenant A", "Tenant A");
            jdbcTemplate.update("INSERT INTO tenant_clinica (id, cnpj, razao_social, nome_fantasia) VALUES (?, ?, ?, ?) ON CONFLICT DO NOTHING", 
                                tenantB, "00000000000002", "Tenant B", "Tenant B");
        } catch(Exception e) {}
    }

    @AfterEach
    public void cleanup() {
        TenantContext.clear();
    }

    @Test
    public void testRecepcaoEndpointSemAutenticacaoRetornaUnauthorized() throws Exception {
        System.out.println("========== TESTE RECEPCAO SEM AUTENTICACAO ==========");
        mockMvc.perform(get("/api/recepcao/pacientes"))
               .andExpect(status().isUnauthorized()); // 401
    }
}

