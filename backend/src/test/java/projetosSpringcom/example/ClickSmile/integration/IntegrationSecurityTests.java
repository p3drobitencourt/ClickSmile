package projetosSpringcom.example.ClickSmile.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.security.dto.LoginRequest;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
                "Dr. Teste",
                "dentista.teste@clinica.com",
                "senha123",
                null,
                "CRO-12345",
                "Ortodontia",
                "Clinica Teste",
                "12345678000199",
                null
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists());

        // 2. Login
        LoginRequest loginReq = new LoginRequest("dentista.teste@clinica.com", "senha123");
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").exists())
                .andExpect(jsonPath("$.perfil").value("DENTISTA"));
    }

    @Test
    public void testDentistaRegistrationFailsWithoutCnpj() throws Exception {
        // Registro de Dentista sem CNPJ deve falhar
        RegisterRequest registerReq = new RegisterRequest(
                Perfil.DENTISTA,
                "Dr. Sem CNPJ",
                "sem.cnpj@clinica.com",
                "senha123",
                null,
                "CRO-123",
                "Geral",
                "Clinica Sem CNPJ",
                null, // CNPJ nulo
                null
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isBadRequest()); // Pode ser 400 ou 500 dependendo do ExceptionHandler
    }
}
