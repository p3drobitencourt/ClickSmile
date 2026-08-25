package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

public class RoleDDLSecurityIT extends BaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void testClickSmileAppCannotExecuteDDL() {
        System.out.println("========== TESTE DE PRIVILÉGIOS (DDL) ==========");

        // 1. Confirma que a conexão da aplicação está utilizando clicksmile_app
        String currentUser = jdbcTemplate.queryForObject("SELECT current_user", String.class);
        assertEquals("clicksmile_app", currentUser, "A aplicação não conectou com clicksmile_app!");

        // 2. Confirma que não há rolsuper nem rolbypassrls
        Map<String, Object> roleInfo = jdbcTemplate.queryForMap(
            "SELECT rolsuper, rolbypassrls FROM pg_roles WHERE rolname = ?", currentUser);
        
        assertFalse((Boolean) roleInfo.get("rolsuper"), "A role possui privilégio de superuser!");
        assertFalse((Boolean) roleInfo.get("rolbypassrls"), "A role possui bypass RLS! Isolamento seria inútil.");

        // 3. Tenta criar uma tabela (DDL) e deve falhar sumariamente
        Exception ddlException = null;
        try {
            jdbcTemplate.execute("CREATE TABLE teste_seguranca_ddl (id uuid)");
        } catch (Exception e) {
            ddlException = e;
        }

        assertNotNull(ddlException, "A execução de DDL deveria ter sido bloqueada!");
        assertTrue(ddlException.getMessage().contains("permission denied for schema public"), 
            "Mensagem de erro inesperada: " + ddlException.getMessage());
        
        System.out.println("Segurança de Privilégios Validada. DDL bloqueado com sucesso.");
    }
}
