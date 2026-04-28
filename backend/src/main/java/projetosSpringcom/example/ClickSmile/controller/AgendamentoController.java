package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.service.AgendamentoService;
import java.util.List;

@RestController
@RequestMapping("/api/agendamentos")
@CrossOrigin(origins = "http://localhost:4200") // CORS liberação para Angular
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

    @GetMapping("/dentista/{dentistaId}")
    public List<Agendamento> listarPorDentista(@PathVariable Long dentistaId) {
        return service.listarPorDentista(dentistaId);
    }
}