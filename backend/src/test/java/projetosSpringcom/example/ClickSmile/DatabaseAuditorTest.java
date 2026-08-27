package projetosSpringcom.example.ClickSmile;

import org.junit.jupiter.api.Test;
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.Statement;

public class DatabaseAuditorTest {
    @Test
    public void testDatabaseAudit() throws Exception {
        String url = "jdbc:postgresql://aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require";
        String user = "postgres.vlgfqocctzicdpcwhhyr";
        String password = "8Y7lpIbLlcARxPnB";

        try (Connection conn = DriverManager.getConnection(url, user, password);
             Statement stmt = conn.createStatement()) {

            System.out.println("=== ETAPA 2: AUDITORIA DO BANCO REAL ===");

            ResultSet rs = stmt.executeQuery("SELECT version();");
            if (rs.next()) { System.out.println("PostgreSQL Version: " + rs.getString(1)); }

            rs = stmt.executeQuery("SELECT current_user, current_database();");
            if (rs.next()) { System.out.println("Current User: " + rs.getString(1) + " | Current DB: " + rs.getString(2)); }

            System.out.println("\n--- Roles and Privileges ---");
            rs = stmt.executeQuery("SELECT rolname, rolsuper, rolbypassrls, rolcreaterole, rolcreatedb FROM pg_roles WHERE rolname IN ('postgres', 'clicksmile_app');");
            while (rs.next()) { System.out.println("Role: " + rs.getString("rolname") + " | Super: " + rs.getBoolean("rolsuper") + " | BypassRLS: " + rs.getBoolean("rolbypassrls")); }

            System.out.println("\n--- Flyway Schema History ---");
            rs = stmt.executeQuery("SELECT version, description, type, success FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 5;");
            while (rs.next()) { System.out.println("V" + rs.getString("version") + " | " + rs.getString("description") + " | " + rs.getString("type") + " | Success: " + rs.getBoolean("success")); }

            System.out.println("\n--- RLS Policies ---");
            rs = stmt.executeQuery("SELECT tablename, policyname, cmd FROM pg_policies WHERE schemaname = 'public';");
            while (rs.next()) { System.out.println("Table: " + rs.getString("tablename") + " | Policy: " + rs.getString("policyname") + " | Cmd: " + rs.getString("cmd")); }

            System.out.println("\n--- Mock Data V7 Check ---");
            rs = stmt.executeQuery("SELECT email, perfil FROM usuario WHERE email IN ('admin@mock.local', 'dentista1@mock.local', 'paciente1@mock.local');");
            while (rs.next()) { System.out.println("Mock User: " + rs.getString("email") + " | Perfil: " + rs.getString("perfil")); }
        }
    }
}
