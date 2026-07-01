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
    private final projetosSpringcom.example.ClickSmile.service.AgendamentoService agendamentoService;

    public DentistaPublicController(UsuarioRepository usuarioRepository, AgendaService agendaService, projetosSpringcom.example.ClickSmile.service.AgendamentoService agendamentoService) {
        this.usuarioRepository = usuarioRepository;
        this.agendaService = agendaService;
        this.agendamentoService = agendamentoService;
    }

    @GetMapping
    public ResponseEntity<List<DentistaResumoDTO>> listar(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double lat,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double lng
    ) {
        if (lat != null && lng != null) {
            double radiusKm = 30.0;
            double latDelta = radiusKm / 111.045;
            double lngDelta = radiusKm / (111.045 * Math.cos(Math.toRadians(lat)));

            double latMin = lat - latDelta;
            double latMax = lat + latDelta;
            double lngMin = lng - lngDelta;
            double lngMax = lng + lngDelta;

            java.time.LocalDate hoje = java.time.LocalDate.now();
            java.time.LocalDate seteDias = hoje.plusDays(7);

            List<DentistaResumoDTO> dadosProximos = usuarioRepository.findDentistasProximos(lat, lng, latMin, latMax, lngMin, lngMax).stream()
                .map(row -> {
                    String idStr = row[0] != null ? row[0].toString() : null;
                    java.util.UUID dentistaId = java.util.UUID.fromString(idStr);
                    String nome = row[1] != null ? row[1].toString() : null;
                    String email = row[2] != null ? row[2].toString() : null;
                    String cro = row[3] != null ? row[3].toString() : null;
                    String especialidade = row[4] != null ? row[4].toString() : null;
                    java.math.BigDecimal latitude = row[5] != null ? new java.math.BigDecimal(row[5].toString()) : null;
                    java.math.BigDecimal longitude = row[6] != null ? new java.math.BigDecimal(row[6].toString()) : null;
                    Double distanciaKm = row[7] != null ? ((Number) row[7]).doubleValue() : null;

                    String agendaInfo = agendaService.buscarPorDentista(dentistaId)
                        .map(a -> a.slotDurationMin() + " min")
                        .orElse("Não configurado");
                        
                    List<projetosSpringcom.example.ClickSmile.dto.SlotResponseDTO> slots = agendamentoService.buscarSlotsLivres(dentistaId, hoje, seteDias);

                    return new DentistaResumoDTO(
                        dentistaId,
                        nome,
                        email,
                        cro,
                        especialidade,
                        agendaInfo,
                        latitude,
                        longitude,
                        distanciaKm,
                        slots
                    );
                })
                .filter(dto -> dto.slots() != null && !dto.slots().isEmpty())
                .toList();
            return ResponseEntity.ok(dadosProximos);
        }

        List<DentistaResumoDTO> dados = usuarioRepository.findByPerfil(Perfil.DENTISTA).stream()
            .filter(Dentista.class::isInstance)
            .map(Dentista.class::cast)
            .map(dentista -> {
                String agendaInfo = agendaService.buscarPorDentista(dentista.getId())
                    .map(a -> a.slotDurationMin() + " min")
                    .orElse("Não configurado");
                List<projetosSpringcom.example.ClickSmile.dto.SlotResponseDTO> slots = agendamentoService.buscarSlotsLivres(dentista.getId(), java.time.LocalDate.now(), java.time.LocalDate.now().plusDays(7));
                return new DentistaResumoDTO(
                    dentista.getId(),
                    dentista.getNome(),
                    dentista.getEmail(),
                    dentista.getCro(),
                    dentista.getEspecialidade(),
                    agendaInfo,
                    null,
                    null,
                    null,
                    slots
                );
            })
            .filter(dto -> dto.slots() != null && !dto.slots().isEmpty())
            .toList();

        return ResponseEntity.ok(dados);
    }
}
