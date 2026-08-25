package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.hamcrest.Matchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class PublicDiscoveryIT extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void visitanteSemJwtDeveAcessarDentistasPublicos() throws Exception {
        mockMvc.perform(get("/api/public/dentistas")
                .param("lat", "-23.55052")
                .param("lng", "-46.633308"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    public void requisicaoComParametrosInvalidosDeveRetornarBadRequest() throws Exception {
        // Exemplo: String no lugar de double para lat
        mockMvc.perform(get("/api/public/dentistas")
                .param("lat", "abc")
                .param("lng", "-46.633308"))
                .andExpect(status().isBadRequest());
    }
}

