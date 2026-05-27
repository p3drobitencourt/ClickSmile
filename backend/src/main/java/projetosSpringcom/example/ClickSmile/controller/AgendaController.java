package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.dto.AgendaRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.AgendaResponseDTO;
import projetosSpringcom.example.ClickSmile.service.AgendaService;

import java.util.UUID;

@RestController
@RequestMapping("/api/agendas")
public class AgendaController {

    private final AgendaService agendaService;

    public AgendaController(AgendaService agendaService) {
        this.agendaService = agendaService;
    }

    @GetMapping("/dentista/{dentistaId}")
    public ResponseEntity<AgendaResponseDTO> get(@PathVariable UUID dentistaId) {
        return ResponseEntity.ok(agendaService.buscarPorDentista(dentistaId));
    }

    @PutMapping
    public ResponseEntity<AgendaResponseDTO> salvar(@Valid @RequestBody AgendaRequestDTO request) {
        return ResponseEntity.ok(agendaService.salvar(request));
    }
}
