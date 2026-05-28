package projetosSpringcom.example.ClickSmile.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
public class ApiProblemDetailsAdviceTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    public void testMalformedJsonReturns400WithoutStacktrace() throws Exception {
        String malformedJson = "{ \"dentistaId\": \"123\", \"dataHora\": \"2024-02-31T10:00:00Z\", "; // Incomplete JSON

        mockMvc.perform(post("/api/agendamentos")
                .contentType(MediaType.APPLICATION_JSON)
                .content(malformedJson))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title").value("JSON inválido"))
                .andExpect(jsonPath("$.detail").value("A requisição está com formato inválido."))
                .andExpect(jsonPath("$.trace").doesNotExist()); // Ensure no Java stacktrace is leaked
    }
}
