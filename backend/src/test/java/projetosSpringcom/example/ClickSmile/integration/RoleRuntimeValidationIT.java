package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.domain.TenantClinica;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.repository.TenantClinicaRepository;
import projetosSpringcom.example.ClickSmile.security.TenantContext;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("prod")
@TestPropertySource(properties = {
    "spring.jpa.hibernate.ddl-auto=none",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect"
})
@Transactional
public class RoleRuntimeValidationIT extends BaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PacienteRepository pacienteRepository;

    @Autowired
    private TenantClinicaRepository tenantClinicaRepository;

    @Autowired
    private TransactionTemplate transactionTemplate;

    private UUID tenantAId;
    private UUID tenantBId;
    private UUID pacienteTenantAId;

    @BeforeEach
    public void setup() {
        // Para preparar dados de teste, precisamos bypassar o TenantContext para inserir os Tenants, 
        // e depois inserir dados para eles simulando os donos.
        TenantContext.clear();
        
        // Vamos checar se já temos tenants. Se não, no catch ou query tratamos.
        // Como o RLS bloqueia, temos que usar jdbcTemplate nativo injetando tenant_id, ou simplesmente 
        // contar com a aplicação rodando em um tenant mockado.
        
        TenantClinica tA = new TenantClinica();
        tA.setId(UUID.randomUUID());
        tA.setCnpj(UUID.randomUUID().toString().substring(0, 14));
        tA.setRazaoSocial("Clinica A");
        tA.setNomeFantasia("Clinica A - RoleTest");
        tA.setCreatedAt(java.time.OffsetDateTime.now());
        tA.setUpdatedAt(java.time.OffsetDateTime.now());
        
        TenantClinica tB = new TenantClinica();
        tB.setId(UUID.randomUUID());
        tB.setCnpj(UUID.randomUUID().toString().substring(0, 14));
        tB.setRazaoSocial("Clinica B");
        tB.setNomeFantasia("Clinica B - RoleTest");
        tB.setCreatedAt(java.time.OffsetDateTime.now());
        tB.setUpdatedAt(java.time.OffsetDateTime.now());

        // Precisamos ser "donos" no contexto da thread para salvar.
        // O Supabase requer tenant_id até para tenant_clinica? O tenant_clinica não tem RLS bloqueante 
        // cross-tenant para leitura total, mas vamos simular:
        try {
            tA = tenantClinicaRepository.save(tA);
            tB = tenantClinicaRepository.save(tB);
        } catch(Exception e) {
            // Se falhar porque não setou context
            tA.setId(UUID.randomUUID());
            TenantContext.setTenantId(tA.getId());
            tA = tenantClinicaRepository.save(tA);
            
            tB.setId(UUID.randomUUID());
            TenantContext.setTenantId(tB.getId());
            tB = tenantClinicaRepository.save(tB);
        }
        
        tenantAId = tA.getId();
        tenantBId = tB.getId();

        // Inserir Paciente em A
        TenantContext.setTenantId(tenantAId);
        Paciente pA = new Paciente();
        pA.setNome("Paciente de A");
        pA.setTenantId(tenantAId);
        pA = pacienteRepository.save(pA);
        pacienteTenantAId = pA.getId();

        TenantContext.clear();
    }

    @Test
    public void testFase3_ValidaRoleRuntime() {
        System.out.println("========== FASE 3: VALIDAÇÃO DA ROLE ==========");
        String currentUser = jdbcTemplate.queryForObject("SELECT current_user", String.class);
        assertEquals("clicksmile_app", currentUser, "A aplicação não conectou com clicksmile_app!");

        Map<String, Object> roleInfo = jdbcTemplate.queryForMap(
            "SELECT rolsuper, rolbypassrls, rolcanlogin FROM pg_roles WHERE rolname = ?", currentUser);
        
        assertFalse((Boolean) roleInfo.get("rolsuper"), "A role possui privilégio de superuser!");
        assertFalse((Boolean) roleInfo.get("rolbypassrls"), "A role possui bypass RLS! Isolamento seria inútil.");
        assertTrue((Boolean) roleInfo.get("rolcanlogin"), "A role precisa de canlogin.");
        
        System.out.println("Role Runtime validada. Current user: " + currentUser);
    }

    @Test
    public void testFase4e5_RLS_e_FindById() {
        System.out.println("========== FASE 4 e 5: RLS E FINDBYID ==========");
        
        // Logado como Tenant B
        TenantContext.setTenantId(tenantBId);

        // 1. Tentar ler paciente do Tenant A via Spring Data (L2/L3)
        Optional<Paciente> pOpt = pacienteRepository.findById(pacienteTenantAId);
        assertTrue(pOpt.isEmpty(), "FALHA CRÍTICA L2: FindById encontrou paciente do Tenant A estando no Tenant B!");

        // 2. Tentar ler paciente via SQL Nativo (L1 RLS Bypass test)
        // Isso vai ignorar filtros do Hibernate e atacar direto o PostgreSQL
        transactionTemplate.execute(status -> {
            List<Map<String, Object>> res = jdbcTemplate.queryForList("SELECT * FROM paciente WHERE id = ?", pacienteTenantAId);
            assertTrue(res.isEmpty(), "FALHA CRÍTICA L1 RLS: O PostgreSQL permitiu a leitura cross-tenant ignorando a policy!");
            return null;
        });

        System.out.println("Isolamento L1, L2 e L3 validado.");
        TenantContext.clear();
    }

    @Test
    public void testFase11_AtaqueFraude() {
        System.out.println("========== FASE 11: TESTE DE ATAQUE ==========");
        // Logado como Tenant B
        TenantContext.setTenantId(tenantBId);
        
        // Tentativa 1: INSERT forjado
        // Instancia paciente com tenant A, mas a thread está como tenant B.
        // O TenantEntityListener DEVE sobrescrever.
        Paciente pForjado = new Paciente();
        pForjado.setNome("Hacker");
        
        pForjado.setTenantId(tenantAId); // Tenta inserir pro A
        
        Paciente salvo = pacienteRepository.save(pForjado);
        assertEquals(tenantBId, salvo.getTenantId(), "O Listener não sobrescreveu a fraude de Tenant!");
        
        // E se o SQL for nativo tentando contornar o Hibernate?
        // O PostgreSQL deve bloquear via RLS (WITH CHECK).
        Exception rlsCheckException = null;
        try {
            transactionTemplate.execute(status -> {
                jdbcTemplate.update("INSERT INTO paciente (tenant_id, nome) VALUES (?, ?)", 
                    tenantAId, "Hacker Nativo");
                return null;
            });
        } catch (Exception e) {
            rlsCheckException = e;
        }
        assertNotNull(rlsCheckException, "RLS deveria ter bloqueado INSERT cross-tenant!");
        String errorMsg = rlsCheckException.getMessage();
        Throwable cause = rlsCheckException.getCause();
        while (cause != null) {
            errorMsg += " | " + cause.getMessage();
            cause = cause.getCause();
        }
        assertTrue(errorMsg.contains("row-level security policy"), 
                   "Mensagem não esperada do PG: " + errorMsg);
                   
        TenantContext.clear();
        System.out.println("Vulnerabilidades de Fraude bloqueadas.");
    }

    @Test
    public void testFase6e7_ConcorrenciaHikari_50Threads() throws InterruptedException {
        System.out.println("========== FASE 6 e 7: HIKARI E SET LOCAL ==========");
        int threads = 50;
        ExecutorService executor = Executors.newFixedThreadPool(25); // Força reuso do pool Hikari
        CountDownLatch latch = new CountDownLatch(threads);
        AtomicInteger leaksFound = new AtomicInteger(0);

        for (int i = 0; i < threads; i++) {
            final boolean isTenantA = (i % 2 == 0);
            executor.submit(() -> {
                try {
                    UUID myTenant = isTenantA ? tenantAId : tenantBId;
                    TenantContext.setTenantId(myTenant);
                    
                    transactionTemplate.execute(status -> {
                        // Faz uma query pela repository para garantir que o Aspect seja acionado!
                        pacienteRepository.findAll();
                        
                        // Busca o contexto atual setado no POSTGRES
                        String dbTenantId = jdbcTemplate.queryForObject("SELECT current_setting('app.tenant_id', true)", String.class);
                        
                        if (!myTenant.toString().equals(dbTenantId)) {
                            leaksFound.incrementAndGet();
                            System.err.println("LEAK DETECTED! Thread esperava " + myTenant + " mas DB estava com " + dbTenantId);
                        }
                        
                        // Simula rollback aleatório para provar que a próxima thread limpa
                        if (Math.random() > 0.5) {
                            status.setRollbackOnly();
                        }
                        
                        return null;
                    });
                } finally {
                    TenantContext.clear();
                    latch.countDown();
                }
            });
        }

        latch.await(30, TimeUnit.SECONDS);
        assertEquals(0, leaksFound.get(), "Houve Leakage de Tenant no HikariCP Pool!");
        System.out.println("Concorrência massiva validada com sucesso. ZERO leaks no Hikari.");
    }
}
