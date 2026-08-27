package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.dto.PacienteRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.PacienteResponseDTO;
import projetosSpringcom.example.ClickSmile.service.RecepcaoService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/dentista/pacientes")
@PreAuthorize("hasAnyRole('DENTISTA', 'TENANT_ADMIN', 'RECEPCAO')")
public class PacienteController {

    private final RecepcaoService recepcaoService;

    public PacienteController(RecepcaoService recepcaoService) {
        this.recepcaoService = recepcaoService;
    }

    @GetMapping
    public ResponseEntity<List<PacienteResponseDTO>> listarPacientes() {
        return ResponseEntity.ok(recepcaoService.listarPacientesDaClinica());
    }

    @GetMapping("/{id}")
    public ResponseEntity<PacienteResponseDTO> buscarPaciente(@PathVariable UUID id) {
        // Aproveitar a listagem e filtrar por ID garante a segurança RLS se ele não for retornado (mas o ideal seria findById)
        // Por praticidade e reuso, buscaremos pela lista. Se não tiver, 404.
        return recepcaoService.listarPacientesDaClinica().stream()
                .filter(p -> p.getId().equals(id))
                .findFirst()
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<PacienteResponseDTO> criarPaciente(@RequestBody PacienteRequestDTO dto) {
        return ResponseEntity.ok(recepcaoService.criarPaciente(dto));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PacienteResponseDTO> atualizarPaciente(@PathVariable UUID id, @RequestBody PacienteRequestDTO dto) {
        return ResponseEntity.ok(recepcaoService.atualizarPaciente(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> excluirPaciente(@PathVariable UUID id) {
        recepcaoService.excluirPaciente(id);
        return ResponseEntity.noContent().build();
    }
}
