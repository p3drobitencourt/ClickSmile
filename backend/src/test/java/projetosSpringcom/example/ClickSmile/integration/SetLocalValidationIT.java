package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.TenantClinica;
import projetosSpringcom.example.ClickSmile.repository.TenantClinicaRepository;
import projetosSpringcom.example.ClickSmile.security.TenantContext;
import projetosSpringcom.example.ClickSmile.service.UsuarioService;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
@ActiveProfiles("prod")
public class SetLocalValidationIT extends BaseIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TenantClinicaRepository tenantClinicaRepository;

    private UUID tenantId;

    @BeforeEach
    public void setup() {
        TenantContext.clear();
        
        TenantClinica t = new TenantClinica();
        t.setId(UUID.randomUUID());
        t.setCnpj("99988877766655");
        t.setRazaoSocial("Clinica Prova SET LOCAL");
        t.setNomeFantasia("Clinica Prova");
        t.setCreatedAt(java.time.OffsetDateTime.now());
        t.setUpdatedAt(java.time.OffsetDateTime.now());
        
        tenantClinicaRepository.save(t);
        tenantId = t.getId();
    }

    @AfterEach
    public void teardown() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("Prova que SET LOCAL app.tenant_id está ativo DURANTE a transação")
    @Transactional
    public void testSetLocalIsActiveDuringTransaction() {
        // 1. Simula o TenantFilter configurando o contexto antes de chamar o Service
        TenantContext.setTenantId(tenantId);
        
        // 2. Dispara uma chamada de leitura que passará pelo TenantAspect
        // Ao chamar findAll(), o UsuarioService (que tem @Transactional) já garantiu a transação
        // e o TenantAspect (@Order(1)) já executou o SET LOCAL na mesma conexão.
        usuarioService.findAll();
        
        // 3. Consulta DIRETAMENTE o PostgreSQL para obter a configuração na transação atual
        String activeTenantIdInDb = jdbcTemplate.queryForObject(
                "SELECT current_setting('app.tenant_id', true)", String.class);
        
        // 4. Se a correção de transação funcionou, o valor DEVE ser o tenantId.
        // Se a correção não tivesse funcionado (sem TX ativa), o valor seria null ou vazio.
        assertEquals(tenantId.toString(), activeTenantIdInDb,
                "A conexão no banco de dados deve ter o app.tenant_id setado para o tenant correto devido à transação Spring ativa");
    }
}
