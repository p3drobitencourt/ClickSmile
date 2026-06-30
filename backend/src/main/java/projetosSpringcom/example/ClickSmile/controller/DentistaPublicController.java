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
                .map(row -> {
                String idStr = row[0] != null ? row[0].toString() : null;
                String nome = row[1] != null ? row[1].toString() : null;
                String email = row[2] != null ? row[2].toString() : null;
                String cro = row[3] != null ? row[3].toString() : null;
                String especialidade = row[4] != null ? row[4].toString() : null;
                java.math.BigDecimal latitude = row[5] != null ? new java.math.BigDecimal(row[5].toString()) : null;
                java.math.BigDecimal longitude = row[6] != null ? new java.math.BigDecimal(row[6].toString()) : null;
                Double distanciaKm = row[7] != null ? ((Number) row[7]).doubleValue() : null;

                    String agendaInfo = agendaService.buscarPorDentista(java.util.UUID.fromString(idStr))
                        .map(a -> a.slotDurationMin() + " min | " + a.horaInicioPadrao() + " - " + a.horaFimPadrao())
                        .orElse("Não configurado");

                    return new DentistaResumoDTO(
                        java.util.UUID.fromString(idStr),
                        nome,
                        email,
                        cro,
                        especialidade,
                        agendaInfo,
                        latitude,
                        longitude,
                        distanciaKm
                    );
                })
                .toList();
            return ResponseEntity.ok(dadosProximos);
        }

        List<DentistaResumoDTO> dados = usuarioRepository.findByPerfil(Perfil.DENTISTA).stream()
            .filter(Dentista.class::isInstance)
            .map(Dentista.class::cast)
            .map(dentista -> {
                String agendaInfo = agendaService.buscarPorDentista(dentista.getId())
                    .map(a -> a.slotDurationMin() + " min | " + a.horaInicioPadrao() + " - " + a.horaFimPadrao())
                    .orElse("Não configurado");
                return new DentistaResumoDTO(
                    dentista.getId(),
                    dentista.getNome(),
                    dentista.getEmail(),
                    dentista.getCro(),
                    dentista.getEspecialidade(),
                    agendaInfo,
                    null,
                    null,
                    null
                );
            })
            .toList();

        return ResponseEntity.ok(dados);
    }
}
