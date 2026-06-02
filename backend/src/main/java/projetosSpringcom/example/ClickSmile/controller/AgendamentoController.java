package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.service.AgendamentoService;
import projetosSpringcom.example.ClickSmile.dto.SlotResponseDTO;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/agendamentos")
public class AgendamentoController {

    private final AgendamentoService service;

    public AgendamentoController(AgendamentoService service) {
        this.service = service;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Agendamento criar(@Valid @RequestBody AgendamentoRequestDTO dto) {
        return service.criar(dto);
    }

    @PutMapping("/{id}")
    public Agendamento reagendar(@PathVariable UUID id, @RequestBody java.util.Map<String, String> body) {
        String novoInicioStr = body.get("novoInicioAt");
        if (novoInicioStr == null) {
            throw new IllegalArgumentException("O campo 'novoInicioAt' é obrigatório.");
        }
        return service.reagendar(id, java.time.OffsetDateTime.parse(novoInicioStr));
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void cancelar(@PathVariable UUID id) {
        service.cancelar(id);
    }

    @GetMapping("/dentista/{dentistaId}")
    public List<Agendamento> listarPorDentista(@PathVariable UUID dentistaId) {
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
    public List<Agendamento> listarPorPaciente(@PathVariable UUID pacienteId) {
        return service.listarPorPaciente(pacienteId);
    }
}