package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.domain.Usuario;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@AutoConfigureMockMvc
public class AdminIT extends BaseIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private projetosSpringcom.example.ClickSmile.security.JwtService jwtService;

    @Test
    public void testPacienteNaoPodeAcessarAdmin() throws Exception {
        Usuario pacienteUser = usuarioRepository.findByEmail("paciente@tenant1.com").orElseThrow();
        String token = jwtService.createAccessToken(pacienteUser);

        mockMvc.perform(get("/api/admin/metricas")
                .header("Authorization", "Bearer " + token)
                .header("X-Tenant-ID", pacienteUser.getTenantId().toString())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testDentistaNaoPodeAcessarAdmin() throws Exception {
        Usuario dentistaUser = usuarioRepository.findByEmail("dentista1@tenant1.com").orElseThrow();
        String token = jwtService.createAccessToken(dentistaUser);

        mockMvc.perform(get("/api/admin/metricas")
                .header("Authorization", "Bearer " + token)
                .header("X-Tenant-ID", dentistaUser.getTenantId().toString())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isForbidden());
    }

    @Test
    public void testAdminAcessaComSucesso() throws Exception {
        Usuario adminUser = usuarioRepository.findByEmail("admin@tenant1.com").orElseThrow();
        String token = jwtService.createAccessToken(adminUser);

        mockMvc.perform(get("/api/admin/metricas")
                .header("Authorization", "Bearer " + token)
                .header("X-Tenant-ID", adminUser.getTenantId().toString())
                .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDentistas").exists())
                .andExpect(jsonPath("$.taxaCancelamento").exists());
    }
}
