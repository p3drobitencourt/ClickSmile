package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

import java.util.List;
import java.util.Map;

@SpringBootTest
@ActiveProfiles("prod")

public class DatabaseAuditIT extends BaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void runAudit() {
        System.out.println("========== INICIANDO AUDITORIA DO BANCO DE DADOS ==========");
        
        System.out.println("\n--- 1. ROLES ---");
        List<Map<String, Object>> roles = jdbcTemplate.queryForList(
            "SELECT rolname, rolcanlogin, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb " +
            "FROM pg_roles ORDER BY rolname;"
        );
        for (Map<String, Object> role : roles) {
            System.out.println(role);
        }
        
        System.out.println("\n--- CURRENT USER ---");
        System.out.println(jdbcTemplate.queryForObject("SELECT current_user", String.class));
        
        System.out.println("\n--- SESSION USER ---");
        System.out.println(jdbcTemplate.queryForObject("SELECT session_user", String.class));

        System.out.println("\n--- 2. TABELAS (PUBLIC SCHEMA) ---");
        List<Map<String, Object>> tables = jdbcTemplate.queryForList(
            "SELECT c.relname as table_name, a.rolname as owner, c.relrowsecurity, c.relforcerowsecurity " +
            "FROM pg_class c " +
            "JOIN pg_namespace n ON n.oid = c.relnamespace " +
            "JOIN pg_authid a ON a.oid = c.relowner " +
            "WHERE n.nspname = 'public' AND c.relkind = 'r' ORDER BY c.relname;"
        );
        for (Map<String, Object> table : tables) {
            String tableName = (String) table.get("table_name");
            
            // Verifica tenant_id
            List<Map<String, Object>> columns = jdbcTemplate.queryForList(
                "SELECT column_name FROM information_schema.columns WHERE table_schema = 'public' AND table_name = ? AND column_name = 'tenant_id'", tableName);
            boolean hasTenantId = !columns.isEmpty();
            
            // Verifica quantia
            Long count = jdbcTemplate.queryForObject("SELECT count(*) FROM " + tableName, Long.class);
            
            System.out.println(table + ", hasTenantId=" + hasTenantId + ", count=" + count);
        }

        System.out.println("\n--- 3. POLICIES ---");
        List<Map<String, Object>> policies = jdbcTemplate.queryForList(
            "SELECT tablename, policyname, permissive, roles, cmd, qual, with_check " +
            "FROM pg_policies WHERE schemaname = 'public' ORDER BY tablename, policyname;"
        );
        for (Map<String, Object> policy : policies) {
            System.out.println(policy);
        }
        
        System.out.println("========== FIM DA AUDITORIA ==========");
    }
}

