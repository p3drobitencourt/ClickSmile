package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoResponseDTO;
import projetosSpringcom.example.ClickSmile.service.AgendamentoService;
import projetosSpringcom.example.ClickSmile.dto.SlotResponseDTO;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import java.time.LocalDate;
import java.util.UUID;
import java.util.Map;
import java.util.HashMap;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;
    private final SimpMessagingTemplate messagingTemplate;

    public AgendamentoController(AgendamentoService service, SimpMessagingTemplate messagingTemplate) {
        this.service = service;
        this.messagingTemplate = messagingTemplate;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public AgendamentoResponseDTO criar(@Valid @RequestBody AgendamentoRequestDTO dto) {
        return service.criar(dto);
    }

    @PutMapping("/{id}")
    public AgendamentoResponseDTO reagendar(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        String novoInicioStr = body.get("novoInicioAt");
        if (novoInicioStr == null) {
            throw new IllegalArgumentException("O campo 'novoInicioAt' é obrigatório.");
        }
        return service.reagendar(id, java.time.OffsetDateTime.parse(novoInicioStr));
    }

    @PatchMapping("/{id}/reagendar")
    public AgendamentoResponseDTO reagendarPatch(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        String novoInicioStr = body.get("novoInicioAt");
        if (novoInicioStr == null) {
            throw new IllegalArgumentException("O campo 'novoInicioAt' é obrigatório.");
        }
        // 1. Transactional Update with Pessimistic Lock (delegated to service)
        AgendamentoResponseDTO agendamento = service.reagendar(id, java.time.OffsetDateTime.parse(novoInicioStr));

        // 2. WebSockets Update (Obrigatório)
        Map<String, Object> payload = new HashMap<>();
        payload.put("action", "FORCE_REFRESH");
        payload.put("agendamentoId", agendamento.id());
        payload.put("novoInicioAt", agendamento.inicioAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        payload.put("novoFimAt", agendamento.fimAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));

        messagingTemplate.convertAndSendToUser(
            agendamento.pacienteId().toString(),
            "/queue/agendamentos",
            payload
        );

        return agendamento;
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@PathVariable UUID id) {
        service.cancelar(id);
    }

    @GetMapping("/dentista/{dentistaId}")
    public List<AgendamentoResponseDTO> listarPorDentista(@PathVariable UUID dentistaId) {
        return service.listarPorDentista(dentistaId);
    }

    @GetMapping("/dentista/{dentistaId}/slots")
    public List<SlotResponseDTO> buscarSlotsLivres(
            @PathVariable UUID dentistaId,
            @RequestParam(required = false) LocalDate inicio,
            @RequestParam(required = false) LocalDate fim) {
        
        if (inicio == null) inicio = LocalDate.now();
        if (fim == null) fim = inicio.plusDays(7);
        
        return service.buscarSlotsLivres(dentistaId, inicio, fim);
    }

    @GetMapping("/paciente/{pacienteId}")
    public List<AgendamentoResponseDTO> listarPorPaciente(@PathVariable UUID pacienteId) {
        return service.listarPorPaciente(pacienteId);
    }
}