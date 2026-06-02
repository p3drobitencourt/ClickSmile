package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.dto.DentistaResumoDTO;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.service.AgendaService;

import java.util.List;

@RestController
@RequestMapping("/api/public/dentistas")
public class DentistaPublicController {

    private final UsuarioRepository usuarioRepository;
    private final AgendaService agendaService;

    public DentistaPublicController(UsuarioRepository usuarioRepository, AgendaService agendaService) {
        this.usuarioRepository = usuarioRepository;
        this.agendaService = agendaService;
    }

    @GetMapping
    public ResponseEntity<List<DentistaResumoDTO>> listar(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double lat,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double lng
    ) {
        if (lat != null && lng != null) {
            List<DentistaResumoDTO> dadosProximos = usuarioRepository.findDentistasProximos(lat, lng).stream()
                .map(proj -> new DentistaResumoDTO(
                    proj.getId(),
                    proj.getNome(),
                    proj.getEmail(),
                    proj.getCro(),
                    proj.getEspecialidade(),
                    agendaService.buscarPorDentista(proj.getId()).slotDurationMin() + " min | " + agendaService.buscarPorDentista(proj.getId()).horaInicioPadrao() + " - " + agendaService.buscarPorDentista(proj.getId()).horaFimPadrao(),
                    proj.getLatitude(),
                    proj.getLongitude(),
                    proj.getDistanciaKm()
                ))
                .toList();
            return ResponseEntity.ok(dadosProximos);
        }

        List<DentistaResumoDTO> dados = usuarioRepository.findByPerfil(Perfil.DENTISTA).stream()
            .filter(Dentista.class::isInstance)
            .map(Dentista.class::cast)
            .map(dentista -> new DentistaResumoDTO(
                dentista.getId(),
                dentista.getNome(),
                dentista.getEmail(),
                dentista.getCro(),
                dentista.getEspecialidade(),
                agendaService.buscarPorDentista(dentista.getId()).slotDurationMin() + " min | " + agendaService.buscarPorDentista(dentista.getId()).horaInicioPadrao() + " - " + agendaService.buscarPorDentista(dentista.getId()).horaFimPadrao(),
                null,
                null,
                null
            ))
            .toList();

        return ResponseEntity.ok(dados);
    }
}
