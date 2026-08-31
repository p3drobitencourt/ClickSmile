package projetosSpringcom.example.ClickSmile.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.security.dto.LoginRequest;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

public class IntegrationSecurityTests extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    public void testDentistaRegistrationAndLoginSuccess() throws Exception {
        // 1. Registro de Dentista (sucesso com CNPJ)
        RegisterRequest registerReq = new RegisterRequest(
                Perfil.DENTISTA,
                "Dr. Teste Produção",
                "dentista.prod.teste@mock.local",
                "123456",
                null,
                "CRO-SP-TESTE01",
                "Clínica Geral",
                "ClickSmile Teste Produção",
                "12345678000199",
                null,
                null
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());

        // 2. Login Dentista
        LoginRequest loginReq = new LoginRequest("dentista.prod.teste@mock.local", "123456");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.perfil").value("DENTISTA"));
                
        // 3. Teste CNPJ duplicado
        RegisterRequest registerDup = new RegisterRequest(
                Perfil.DENTISTA,
                "Dr. Duplicado",
                "dup@mock.local",
                "123456",
                null,
                "CRO-999",
                "Geral",
                "Clinica Dup",
                "12345678000199", // CNPJ duplicado
                null,
                null
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerDup)))
                .andExpect(status().isBadRequest());
    }

    @Test
    public void testDentistaRegistrationFailsWithoutCnpj() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                Perfil.DENTISTA,
                "Dr. Sem CNPJ",
                "sem.cnpj@clinica.com",
                "123456",
                null,
                "CRO-123",
                "Geral",
                "Clinica Sem CNPJ",
                null, // CNPJ nulo
                null,
                null
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isBadRequest()); 
    }

    @Test
    public void testPacienteRegistrationWithoutTenantFails() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                Perfil.PACIENTE,
                "Paciente Sem Tenant",
                "paciente.sem@mock.local",
                "123456",
                "11999999999",
                null, null, null, null, null, null
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isBadRequest()); 
    }

    @Test
    public void testPacienteRegistrationAndLoginSuccess() throws Exception {
        // Primeiro cria uma clinica
        RegisterRequest registerReq = new RegisterRequest(
                Perfil.DENTISTA,
                "Dr. Clinica Publica",
                "dr.clinica@mock.local",
                "123456",
                null,
                "CRO-12345",
                "Geral",
                "Clinica Publica Teste",
                "99999999000199",
                null,
                null
        );
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk());

        // Busca clinicas
        MvcResult clinicasResult = mockMvc.perform(get("/api/public/clinicas"))
                .andExpect(status().isOk())
                .andReturn();
                
        String json = clinicasResult.getResponse().getContentAsString();
        JsonNode root = objectMapper.readTree(json);
        String tenantId = null;
        for (JsonNode node : root) {
            if (node.get("cnpj").asText().equals("99999999000199")) {
                tenantId = node.get("id").asText();
                break;
            }
        }
        
        assert tenantId != null;

        // Registra Paciente
        RegisterRequest pacienteReq = new RegisterRequest(
                Perfil.PACIENTE,
                "Paciente Prod Teste",
                "paciente.prod.teste@mock.local",
                "123456",
                "11999999999",
                null, null, null, null,
                UUID.fromString(tenantId),
                null
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(pacienteReq)))
                .andExpect(status().isOk());

        // Login Paciente
        LoginRequest loginReq = new LoginRequest("paciente.prod.teste@mock.local", "123456");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.perfil").value("PACIENTE"));
    }

    @Test
    public void testInvalidLoginFails() throws Exception {
        // Inexistente
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("naoexiste@teste.com", "123456"))))
                .andExpect(status().isUnauthorized());

        // Senha incorreta (usando o user de teste da clinica publica)
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LoginRequest("dr.clinica@mock.local", "errada"))))
                .andExpect(status().isUnauthorized());
    }
}
