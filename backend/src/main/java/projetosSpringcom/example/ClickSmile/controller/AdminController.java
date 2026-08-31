package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.dto.AdminMetricsDTO;
import projetosSpringcom.example.ClickSmile.dto.AdminUsuarioDTO;
import projetosSpringcom.example.ClickSmile.repository.AgendamentoRepository;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.service.UsuarioService;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Controller de administração — delega acesso a usuario ao UsuarioService
 * (@Transactional) para garantir que o TenantAspect + RLS funcionem corretamente.
 *
 * Métricas que envolvem outros repositories (agendamento, paciente) são
 * mantidas com @Transactional explícito no método, pois os services desses
 * repositórios já possuem seus próprios métodos transacionais. A alternativa
 * futura é extrair para um AdminService dedicado.
 */
@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('TENANT_ADMIN')")
public class AdminController {

    private final AgendamentoRepository agendamentoRepository;
    private final PacienteRepository pacienteRepository;
    private final UsuarioService usuarioService;

    public AdminController(AgendamentoRepository agendamentoRepository,
                           PacienteRepository pacienteRepository,
                           UsuarioService usuarioService) {
        this.agendamentoRepository = agendamentoRepository;
        this.pacienteRepository = pacienteRepository;
        this.usuarioService = usuarioService;
    }

    /**
     * @Transactional(readOnly=true) garante que os repositórios de agendamento
     * e paciente (chamados diretamente aqui) também recebam o SET LOCAL correto
     * do TenantAspect dentro de uma transação ativa.
     */
    @GetMapping("/metricas")
    @org.springframework.transaction.annotation.Transactional(readOnly = true)
    public ResponseEntity<AdminMetricsDTO> getMetricas(
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime startDate,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.OffsetDateTime endDate) {

        if (startDate == null) startDate = java.time.OffsetDateTime.now().minusDays(30);
        if (endDate == null)   endDate   = java.time.OffsetDateTime.now();

        long totalPacientes         = pacienteRepository.count();
        long novosPacientes         = pacienteRepository.countNovosPacientes(startDate);
        long totalDentistas         = usuarioService.countByPerfil(Perfil.DENTISTA);
        long totalAgendamentos      = agendamentoRepository.count();
        long agendamentosConcluidos = agendamentoRepository.countByStatusAndPeriodo(
                projetosSpringcom.example.ClickSmile.domain.StatusAgendamento.CONCLUIDO, startDate, endDate);
        long agendamentosCancelados = agendamentoRepository.countByStatusAndPeriodo(
                projetosSpringcom.example.ClickSmile.domain.StatusAgendamento.CANCELADO, startDate, endDate);
        long totalNoPeriodo         = agendamentoRepository.countNovosAgendamentos(startDate);
        double taxaCancelamento     = totalNoPeriodo > 0
                ? (double) agendamentosCancelados / totalNoPeriodo * 100
                : 0.0;

        AdminMetricsDTO dto = new AdminMetricsDTO(
            totalPacientes, novosPacientes, totalDentistas, totalAgendamentos,
            agendamentosConcluidos, agendamentosCancelados, taxaCancelamento
        );
        return ResponseEntity.ok(dto);
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<AdminUsuarioDTO>> getUsuarios() {
        List<AdminUsuarioDTO> dtos = usuarioService.findAll().stream()
                .map(u -> new AdminUsuarioDTO(
                        u.getId(),
                        u.getNome(),
                        u.getEmail(),
                        u.getPerfil().name(),
                        u.getStatus()
                ))
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }

    @PatchMapping("/usuarios/{id}/status")
    public ResponseEntity<?> toggleUserStatus(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equals("ACTIVE") && !newStatus.equals("BLOCKED"))) {
            return ResponseEntity.badRequest().body("Status inválido");
        }

        try {
            usuarioService.updateStatus(id, newStatus);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
