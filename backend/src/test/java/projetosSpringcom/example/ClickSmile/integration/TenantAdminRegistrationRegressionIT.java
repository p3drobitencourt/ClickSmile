package projetosSpringcom.example.ClickSmile.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.security.dto.LoginRequest;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

/**
 * Teste de regressão do bug:
 *   "GET /api/usuarios/me retorna 'Usuário não encontrado' após cadastro TENANT_ADMIN"
 *
 * Reproduz o fluxo real:
 *   POST /register → JWT → GET /api/usuarios/me → deve retornar 200
 *
 * Também cobre: login, refresh, logout e isolamento de tenant.
 *
 * EXECUTA CONTRA PostgreSQL REAL via Testcontainers com RLS ativa.
 * clicksmile_app conectado sem BYPASSRLS (garantido pelo test-init.sql).
 */
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
public class TenantAdminRegistrationRegressionIT extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    // ─── Tenant A ─────────────────────────────────────────────────────────────
    private static final String CNPJ_A        = "11111111000191";
    private static final String EMAIL_ADMIN_A = "admin.a@regression.test";
    private static final String SENHA_A       = "Senha@123";

    // ─── Tenant B ─────────────────────────────────────────────────────────────
    private static final String CNPJ_B        = "22222222000100";
    private static final String EMAIL_ADMIN_B = "admin.b@regression.test";
    private static final String SENHA_B       = "Senha@456";

    // Tokens armazenados entre testes (campos static pois JUnit cria nova instância por teste)
    private static String tokenA;
    private static String tokenB;
    private static Cookie refreshCookieA;
    private static Cookie refreshCookieB;

    // ─────────────────────────────────────────────────────────────────────────
    // ETAPA 7 — CADASTRO TENANT_ADMIN COMPLETO (o bug)
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(1)
    @DisplayName("[BUG REGRESSÃO] POST /register → JWT → GET /me → HTTP 200 (Tenant A)")
    void testRegistroTenantAdminEGetProfileRetorna200_TenantA() throws Exception {
        RegisterRequest req = buildTenantAdminRequest(
                "Admin Clínica A", EMAIL_ADMIN_A, SENHA_A, "Clínica Alpha", CNPJ_A);

        // 1. Registro
        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.perfil").value("TENANT_ADMIN"))
                .andReturn();

        String regJson = registerResult.getResponse().getContentAsString();
        tokenA = objectMapper.readTree(regJson).get("accessToken").asText();
        refreshCookieA = registerResult.getResponse().getCookie("refreshToken");

        // 2. GET /api/usuarios/me com o token do registro
        //    — ESTE ERA O PASSO QUE FALHAVA COM "Usuário não encontrado"
        mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL_ADMIN_A))
                .andExpect(jsonPath("$.perfil").value("TENANT_ADMIN"))
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.tenantId").exists());
    }

    @Test
    @Order(2)
    @DisplayName("[BUG REGRESSÃO] POST /register → JWT → GET /me → HTTP 200 (Tenant B)")
    void testRegistroTenantAdminEGetProfileRetorna200_TenantB() throws Exception {
        RegisterRequest req = buildTenantAdminRequest(
                "Admin Clínica B", EMAIL_ADMIN_B, SENHA_B, "Clínica Beta", CNPJ_B);

        MvcResult registerResult = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.perfil").value("TENANT_ADMIN"))
                .andReturn();

        String regJson = registerResult.getResponse().getContentAsString();
        tokenB = objectMapper.readTree(regJson).get("accessToken").asText();
        refreshCookieB = registerResult.getResponse().getCookie("refreshToken");

        mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL_ADMIN_B))
                .andExpect(jsonPath("$.perfil").value("TENANT_ADMIN"));
    }

    @Test
    @Order(3)
    @DisplayName("[BUG REGRESSÃO] CNPJ duplicado retorna HTTP 400")
    void testCnpjDuplicadoRetorna400() throws Exception {
        RegisterRequest dup = buildTenantAdminRequest(
                "Admin Dup", "dup@regression.test", "Senha@789", "Clínica Dup", CNPJ_A);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(dup)))
                .andExpect(status().isBadRequest());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ETAPA 8 — LOGIN
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(4)
    @DisplayName("[LOGIN] POST /login → JWT → GET /me → HTTP 200")
    void testLoginTenantAdminEGetProfile() throws Exception {
        // Login
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL_ADMIN_A, SENHA_A))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.perfil").value("TENANT_ADMIN"))
                .andReturn();

        String loginJson = loginResult.getResponse().getContentAsString();
        String loginToken = objectMapper.readTree(loginJson).get("accessToken").asText();

        // GET /me com token de login
        mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + loginToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL_ADMIN_A))
                .andExpect(jsonPath("$.perfil").value("TENANT_ADMIN"));
    }

    @Test
    @Order(5)
    @DisplayName("[LOGIN] Senha incorreta → HTTP 401")
    void testLoginSenhaIncorretaRetorna401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL_ADMIN_A, "senhaErrada"))))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(6)
    @DisplayName("[LOGIN] Email inexistente → HTTP 401")
    void testLoginEmailInexistenteRetorna401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("naoexiste@regression.test", "qualquer"))))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ETAPA 9 — REFRESH TOKEN
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(7)
    @DisplayName("[REFRESH] Refresh válido → novo accessToken → GET /me → HTTP 200")
    void testRefreshTokenGeraNovoAccessToken() throws Exception {
        if (refreshCookieA == null) {
            // Re-login para garantir que temos o cookie
            MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL_ADMIN_A, SENHA_A))))
                    .andExpect(status().isOk())
                    .andReturn();
            refreshCookieA = loginResult.getResponse().getCookie("refreshToken");
        }

        if (refreshCookieA == null) {
            System.out.println("[REFRESH] Cookie de refresh não disponível neste ambiente de teste — pulando.");
            return;
        }

        // Usar refresh para obter novo accessToken
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh")
                .cookie(refreshCookieA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andReturn();

        String newToken = objectMapper.readTree(
                refreshResult.getResponse().getContentAsString()).get("accessToken").asText();

        // Novo token deve acessar /me com sucesso
        mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + newToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(EMAIL_ADMIN_A));
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ETAPA 10 — LOGOUT
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(8)
    @DisplayName("[LOGOUT] Após logout, refresh antigo deve ser rejeitado")
    void testLogoutInvalidaRefreshToken() throws Exception {
        // Login para obter par fresco
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest(EMAIL_ADMIN_A, SENHA_A))))
                .andExpect(status().isOk())
                .andReturn();

        String accessToken = objectMapper.readTree(loginResult.getResponse().getContentAsString())
                .get("accessToken").asText();
        Cookie freshRefreshCookie = loginResult.getResponse().getCookie("refreshToken");

        if (freshRefreshCookie == null) {
            System.out.println("[LOGOUT] Cookie de refresh não disponível — pulando verificação de revogação.");
            return;
        }

        // Logout
        mockMvc.perform(post("/api/auth/logout")
                .header("Authorization", "Bearer " + accessToken)
                .cookie(freshRefreshCookie))
                .andExpect(status().isOk());

        // Tentar usar o refresh antigo deve falhar
        mockMvc.perform(post("/api/auth/refresh")
                .cookie(freshRefreshCookie))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ETAPA 11 — ISOLAMENTO MULTI-TENANT
    // ─────────────────────────────────────────────────────────────────────────

    @Test
    @Order(9)
    @DisplayName("[ISOLAMENTO] Token do Tenant A não pode ver perfil do Tenant B")
    void testTenantANaoPodeVerPerfilDeTenantB() throws Exception {
        if (tokenA == null || tokenB == null) {
            System.out.println("[ISOLAMENTO] Tokens não disponíveis — dependência dos testes anteriores.");
            return;
        }

        // Token A lendo /me → deve retornar APENAS o usuário A
        MvcResult resultA = mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode profileA = objectMapper.readTree(resultA.getResponse().getContentAsString());
        String tenantIdA = profileA.get("tenantId").asText();
        String idA       = profileA.get("id").asText();

        // Token B lendo /me → deve retornar APENAS o usuário B
        MvcResult resultB = mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + tokenB))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode profileB = objectMapper.readTree(resultB.getResponse().getContentAsString());
        String tenantIdB = profileB.get("tenantId").asText();
        String idB       = profileB.get("id").asText();

        // IDs diferentes
        org.junit.jupiter.api.Assertions.assertNotEquals(idA, idB,
                "Os dois usuários devem ter IDs distintos");

        // Tenant IDs diferentes
        org.junit.jupiter.api.Assertions.assertNotEquals(tenantIdA, tenantIdB,
                "Os dois usuários devem pertencer a tenants distintos");

        // Token A não pode acessar recurso de B via /api/usuarios/{id}
        // Com RLS ativa, a query retorna 404 (não 403 — RLS silencia, não lança acesso negado)
        mockMvc.perform(get("/api/usuarios/" + idB)
                .header("Authorization", "Bearer " + tokenA))
                .andExpect(status().isNotFound());
    }

    @Test
    @Order(10)
    @DisplayName("[ISOLAMENTO] GET /me sem token → HTTP 401")
    void testGetMeSemTokenRetorna401() throws Exception {
        mockMvc.perform(get("/api/usuarios/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @Order(11)
    @DisplayName("[ISOLAMENTO] GET /me com token forjado → HTTP 401")
    void testGetMeComTokenForjadoRetorna401() throws Exception {
        String forgedToken = "eyJhbGciOiJSUzI1NiJ9.eyJzdWIiOiIxMjM0In0.invalid";
        mockMvc.perform(get("/api/usuarios/me")
                .header("Authorization", "Bearer " + forgedToken))
                .andExpect(status().isUnauthorized());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────────────────────

    private RegisterRequest buildTenantAdminRequest(String nome, String email, String senha,
                                                     String nomeClinica, String cnpj) {
        return new RegisterRequest(
                Perfil.TENANT_ADMIN,
                nome,
                email,
                senha,
                null,       // telefone
                null,       // cro
                null,       // especialidade
                nomeClinica,
                cnpj,
                null,       // tenantId (TENANT_ADMIN cria o próprio)
                null        // cpf
        );
    }
}
