package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@SpringBootTest
@ActiveProfiles("prod")

public class ExecuteInfrastructureIT extends BaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void createRoleAndGrants() {
        System.out.println("========== EXECUTANDO CRIAÇÃO DA ROLE E PERMISSÕES ==========");
        
        // 1. Criar Role (pode falhar se já existe)
        try {
            jdbcTemplate.execute("CREATE ROLE clicksmile_app WITH LOGIN PASSWORD 'ClickSmile#App!2026'");
            System.out.println("Role clicksmile_app criada com sucesso.");
        } catch (Exception e) {
            System.out.println("Role clicksmile_app provávelmente já existe: " + e.getMessage());
        }

        // 3. Permissões de schema e banco
        jdbcTemplate.execute("GRANT CONNECT ON DATABASE postgres TO clicksmile_app");
        jdbcTemplate.execute("GRANT USAGE ON SCHEMA public TO clicksmile_app");

        // 4. Permissões DML
        jdbcTemplate.execute("GRANT SELECT, INSERT, UPDATE, DELETE ON agenda, agendamento, cliente, conversa_chat, dentista, mensagem, paciente, refresh_token, sessao_chat, tenant_clinica, usuario, usuario_role TO clicksmile_app");

        // 5. Permissão em roles (read only)
        jdbcTemplate.execute("GRANT SELECT ON role TO clicksmile_app");

        // 6. Sequences
        jdbcTemplate.execute("GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO clicksmile_app");

        // 7. Default privileges
        jdbcTemplate.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO clicksmile_app");
        jdbcTemplate.execute("ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO clicksmile_app");

        System.out.println("========== PERMISSÕES APLICADAS ==========");
    }
}

