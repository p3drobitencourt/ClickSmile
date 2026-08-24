package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.dto.PacienteResponseDTO;
import projetosSpringcom.example.ClickSmile.dto.AgendaDiaDentistaDTO;
import projetosSpringcom.example.ClickSmile.service.RecepcaoService;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/recepcao")
@PreAuthorize("hasAnyRole('RECEPCAO', 'TENANT_ADMIN')")
public class RecepcaoController {

    private final RecepcaoService recepcaoService;

    public RecepcaoController(RecepcaoService recepcaoService) {
        this.recepcaoService = recepcaoService;
    }

    @GetMapping("/pacientes")
    public ResponseEntity<List<PacienteResponseDTO>> listarPacientes() {
        return ResponseEntity.ok(recepcaoService.listarPacientesDaClinica());
    }

    @GetMapping("/agendas/dia")
    public ResponseEntity<List<AgendaDiaDentistaDTO>> listarAgendasDoDia(@RequestParam(required = false) LocalDate data) {
        if (data == null) {
            data = LocalDate.now();
        }
        return ResponseEntity.ok(recepcaoService.listarAgendasDoDia(data));
    }
}
