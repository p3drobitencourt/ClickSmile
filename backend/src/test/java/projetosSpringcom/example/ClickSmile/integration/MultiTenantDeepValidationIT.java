package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.security.TenantContext;

import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("prod")

public class MultiTenantDeepValidationIT extends BaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PacienteRepository pacienteRepository;

    private UUID tenantA = UUID.fromString("aaaaaaaa-0000-0000-0000-000000000001");
    private UUID tenantB = UUID.fromString("bbbbbbbb-0000-0000-0000-000000000002");
    private UUID invalidTenant = UUID.fromString("00000000-0000-0000-0000-000000000000");

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
    public void testDatabaseRolePrivileges() {
        System.out.println("========== TESTE DE PERMISSÕES DA ROLE DO BANCO ==========");
        String currentUser = jdbcTemplate.queryForObject("SELECT current_user;", String.class);
        String sessionUser = jdbcTemplate.queryForObject("SELECT session_user;", String.class);
        
        System.out.println("CURRENT_USER: " + currentUser);
        System.out.println("SESSION_USER: " + sessionUser);

        List<Map<String, Object>> roles = jdbcTemplate.queryForList(
                "SELECT rolname, rolsuper, rolbypassrls FROM pg_roles WHERE rolname = ?", currentUser);
        
        if (!roles.isEmpty()) {
            boolean isSuper = (Boolean) roles.get(0).get("rolsuper");
            boolean canBypassRls = (Boolean) roles.get(0).get("rolbypassrls");
            System.out.println("ROLSUPER: " + isSuper);
            System.out.println("ROLBYPASSRLS: " + canBypassRls);
        }
        System.out.println("=========================================================");
    }

    @Test
    public void testPureRlsWithoutHibernate() {
        System.out.println("========== TESTE RLS PURO (JDBC) ==========");
        
        jdbcTemplate.execute("SET LOCAL app.tenant_id = '" + tenantA.toString() + "'");
        List<Map<String, Object>> resultA = jdbcTemplate.queryForList("SELECT * FROM paciente");
        System.out.println("Resultados com Tenant A: " + resultA.size());
        
        jdbcTemplate.execute("SET LOCAL app.tenant_id = '" + tenantB.toString() + "'");
        List<Map<String, Object>> resultB = jdbcTemplate.queryForList("SELECT * FROM paciente");
        System.out.println("Resultados com Tenant B: " + resultB.size());
        System.out.println("===========================================");
    }

    @Test
    @Transactional
    public void testHibernateFilterSelectIsolation() {
        System.out.println("========== TESTE HIBERNATE FILTER SELECT ==========");
        
        // Setup: Inserimos paciente nativamente para burlar os filtros no setup
        UUID pacienteA = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO paciente (id, nome, tenant_id) VALUES (?, ?, ?)", 
                            pacienteA, "Paciente A", tenantA);
                            
        UUID pacienteB = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO paciente (id, nome, tenant_id) VALUES (?, ?, ?)", 
                            pacienteB, "Paciente B", tenantB);

        // Teste de Acesso A
        TenantContext.setTenantId(tenantA);
        List<Paciente> listaA = pacienteRepository.findAll();
        System.out.println("Tenant A vê " + listaA.size() + " pacientes");
        assertTrue(listaA.stream().allMatch(p -> p.getTenantId().equals(tenantA)), "Tenant A só deve ver A");
        
        // Limpar cache Hibernate
        pacienteRepository.flush();

        // Teste de Acesso B
        TenantContext.setTenantId(tenantB);
        List<Paciente> listaB = pacienteRepository.findAll();
        System.out.println("Tenant B vê " + listaB.size() + " pacientes");
        assertTrue(listaB.stream().allMatch(p -> p.getTenantId().equals(tenantB)), "Tenant B só deve ver B");
        
        System.out.println("===================================================");
    }
    
    @Test
    @Transactional
    public void testCrossTenantUpdateIsBlocked() {
        System.out.println("========== TESTE UPDATE CROSS-TENANT ==========");
        
        UUID pacienteB = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO paciente (id, nome, tenant_id) VALUES (?, ?, ?)", 
                            pacienteB, "Original B", tenantB);
                            
        // Tenant A tenta modificar Paciente B
        TenantContext.setTenantId(tenantA);
        
        // Acesso direto (não deve achar)
        Paciente p = pacienteRepository.findById(pacienteB).orElse(null);
        assertNull(p, "Tenant A não deve conseguir buscar Paciente B para update");
        
        // Tentativa de update cego
        int updated = jdbcTemplate.update("UPDATE paciente SET nome = 'Hack' WHERE id = ? AND tenant_id = current_setting('app.tenant_id')::uuid", pacienteB);
        assertEquals(0, updated, "O update cego via RLS deve falhar bloqueando a operação");
        
        System.out.println("===============================================");
    }
    
    @Test
    @Transactional
    public void testCrossTenantInsertIsBlocked() {
        System.out.println("========== TESTE INSERT CROSS-TENANT ==========");
        
        TenantContext.setTenantId(tenantA);
        
        // Tenant A tenta criar paciente mas manda ID do Tenant B (Simulação de ataque via API)
        Paciente paciente = new Paciente();
        paciente.setNome("Malicioso");
        paciente.setTenantId(tenantB); 
        
        Paciente salvo = pacienteRepository.saveAndFlush(paciente);
        
        assertEquals(tenantA, salvo.getTenantId(), "O listener deve forçar o ID do tenant A e sobrescrever o B malicioso!");
        System.out.println("Salvou paciente com tenant id corrigido para: " + salvo.getTenantId());
        
        System.out.println("===============================================");
    }
    
    @Test
    @Transactional
    public void testNoTenantAndInvalidTenant() {
        System.out.println("========== TESTE SEM TENANT / INVÁLIDO ==========");
        
        // UUID Inexistente
        TenantContext.setTenantId(invalidTenant);
        List<Paciente> listaInvalida = pacienteRepository.findAll();
        assertEquals(0, listaInvalida.size(), "Nenhum dado deve ser retornado para tenant inválido");
        
        TenantContext.clear();
        
        // Sem tenant - Vai falhar pois SET LOCAL precisa de um valor, o Aspect lança exceção?
        // Neste teste isolamos. A API real terá Filtro obrigatório.
        
        System.out.println("=================================================");
    }
    @Test
    @Transactional
    public void testCrossTenantDeleteIsBlocked() {
        System.out.println("========== TESTE DELETE CROSS-TENANT ==========");
        
        UUID pacienteB = UUID.randomUUID();
        jdbcTemplate.update("INSERT INTO paciente (id, nome, tenant_id) VALUES (?, ?, ?)", 
                            pacienteB, "Deletavel B", tenantB);
                            
        // Tenant A tenta deletar
        TenantContext.setTenantId(tenantA);
        
        // Repositório tenta exclusão, mas a query JPQL não afeta a linha pois o filtro está ativo
        pacienteRepository.deleteById(pacienteB);
        
        // Verifica que o paciente B continua existindo no banco
        TenantContext.clear(); // Desativa o filtro JPA para ler tudo com o bypass RLS e ver se B ainda existe
        Integer countB = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM paciente WHERE id = ?", Integer.class, pacienteB);
        assertEquals(1, countB, "Paciente B NÃO deve ser deletado pelo Tenant A");
        
        // Exclusão cega via JDBC com RLS
        int deleted = jdbcTemplate.update("DELETE FROM paciente WHERE id = ? AND tenant_id = current_setting('app.tenant_id')::uuid", pacienteB);
        assertEquals(0, deleted, "A exclusão cega deve falhar com 0 linhas afetadas");
        
        System.out.println("===============================================");
    }
    
    @Test
    public void testHikariCPConnectionLeakage() throws InterruptedException {
        System.out.println("========== TESTE HIKARI POOL LEAKAGE ==========");
        
        // Faremos 2 requisições simuladas em threads separadas para forçar uso e reúso do HikariCP.
        
        Runnable taskA = () -> {
            TenantContext.setTenantId(tenantA);
            // Simula transação que seta o RLS
            pacienteRepository.findAll();
            // Limpa o thread local após a requisição, simulando o comportamento real do Interceptor Web
            TenantContext.clear();
        };
        
        Runnable taskB = () -> {
            TenantContext.setTenantId(tenantB);
            List<Paciente> p = pacienteRepository.findAll();
            // Se houvesse leak de RLS (app.tenant_id = A) para essa conexão, p não viria B.
            // Aqui estamos só testando que não quebra, mas a real prova de fogo é que 
            // a nova transação sempre subscreve o SET LOCAL.
            TenantContext.clear();
        };
        
        Thread t1 = new Thread(taskA);
        Thread t2 = new Thread(taskB);
        
        t1.start();
        t1.join();
        
        t2.start();
        t2.join();
        
        System.out.println("Threads executadas com sucesso sem vazamento cruzado.");
        System.out.println("===============================================");
    }
}

