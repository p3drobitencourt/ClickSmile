package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.dto.AdminMetricsDTO;
import projetosSpringcom.example.ClickSmile.dto.AdminUsuarioDTO;
import projetosSpringcom.example.ClickSmile.repository.AgendamentoRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;

import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    @Autowired
    private AgendamentoRepository agendamentoRepository;

    @Autowired
    private UsuarioRepository usuarioRepository;

    @GetMapping("/metricas")
    public ResponseEntity<AdminMetricsDTO> getMetricas() {
        long consultasAtivas = agendamentoRepository.countByStatusIn(Arrays.asList("PENDENTE", "CONFIRMADO"));
        long volumeCancelamentos = agendamentoRepository.countByStatus("CANCELADO");
        long totalDentistas = usuarioRepository.countByPerfil(Perfil.DENTISTA);

        return ResponseEntity.ok(new AdminMetricsDTO(consultasAtivas, totalDentistas, volumeCancelamentos));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<AdminUsuarioDTO>> getUsuarios() {
        List<AdminUsuarioDTO> dtos = usuarioRepository.findAll().stream().map(u -> new AdminUsuarioDTO(
                u.getId(),
                u.getNome(),
                u.getEmail(),
                u.getPerfil().name(),
                u.getStatus()
        )).collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/usuarios/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("BLOCKED"))) {
            return ResponseEntity.badRequest().body("Status inválido");
        }

        Usuario usuario = usuarioRepository.findById(id).orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        usuario.setStatus(newStatus);
        usuarioRepository.save(usuario);

        return ResponseEntity.ok().build();
    }
}
