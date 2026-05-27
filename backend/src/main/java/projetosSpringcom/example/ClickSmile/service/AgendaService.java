package projetosSpringcom.example.ClickSmile.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Agenda;
import projetosSpringcom.example.ClickSmile.dto.AgendaRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.AgendaResponseDTO;
import projetosSpringcom.example.ClickSmile.dto.RegraHorarioDTO;
import projetosSpringcom.example.ClickSmile.repository.AgendaRepository;

import java.time.DayOfWeek;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Service
public class AgendaService {

    private final AgendaRepository agendaRepository;
    private final ObjectMapper objectMapper;

    public AgendaService(AgendaRepository agendaRepository, ObjectMapper objectMapper) {
        this.agendaRepository = agendaRepository;
        this.objectMapper = objectMapper.copy().findAndRegisterModules();
    }

    @Transactional
    public AgendaResponseDTO salvar(AgendaRequestDTO request) {
        Agenda agenda = agendaRepository.findByDentistaUsuarioId(request.dentistaId()).orElseGet(Agenda::new);
        agenda.setDentistaUsuarioId(request.dentistaId());
        agenda.setTimezone(request.timezone());
        agenda.setSlotDurationMin(request.slotDurationMin());
        agenda.setHoraInicioPadrao(request.horaInicioPadrao());
        agenda.setHoraFimPadrao(request.horaFimPadrao());
        agenda.setRegraSemanaJson(writeRules(request.regras()));
        agenda.setAtivo(true);
        return toDto(agendaRepository.save(agenda));
    }

    @Transactional(readOnly = true)
    public AgendaResponseDTO buscarPorDentista(UUID dentistaId) {
        return agendaRepository.findByDentistaUsuarioId(dentistaId)
            .map(this::toDto)
            .orElseGet(() -> toDto(defaultAgenda(dentistaId)));
    }

    @Transactional(readOnly = true)
    public boolean slotPermitido(UUID dentistaId, LocalDateTime inicio, LocalDateTime fim) {
        Agenda agenda = agendaRepository.findByDentistaUsuarioId(dentistaId)
            .orElseGet(() -> defaultAgenda(dentistaId));
        List<RegraHorarioDTO> regras = readRules(agenda.getRegraSemanaJson());
        DayOfWeek dia = inicio.getDayOfWeek();

        RegraHorarioDTO regra = regras.stream()
            .filter(item -> item.ativo() != null && item.ativo() && dia.name().equalsIgnoreCase(item.diaSemana()))
            .findFirst()
            .orElse(null);

        if (regra == null) {
            return false;
        }

        LocalTime inicioSlot = inicio.toLocalTime();
        LocalTime fimSlot = fim.toLocalTime();

        boolean dentroDoHorario = !inicioSlot.isBefore(regra.inicio()) && !fimSlot.isAfter(regra.fim());
        if (!dentroDoHorario) {
            return false;
        }

        if (regra.pausaInicio() != null && regra.pausaFim() != null) {
            boolean cruzaPausa = inicioSlot.isBefore(regra.pausaFim()) && fimSlot.isAfter(regra.pausaInicio());
            if (cruzaPausa) {
                return false;
            }
        }

        return true;
    }

    private Agenda defaultAgenda(UUID dentistaId) {
        Agenda agenda = new Agenda();
        agenda.setDentistaUsuarioId(dentistaId);
        agenda.setRegraSemanaJson(writeRules(defaultRules()));
        return agenda;
    }

    private AgendaResponseDTO toDto(Agenda agenda) {
        return new AgendaResponseDTO(
            agenda.getId(),
            agenda.getDentistaUsuarioId(),
            agenda.getTimezone(),
            agenda.getSlotDurationMin(),
            agenda.getHoraInicioPadrao(),
            agenda.getHoraFimPadrao(),
            readRules(agenda.getRegraSemanaJson()),
            agenda.isAtivo()
        );
    }

    private String writeRules(List<RegraHorarioDTO> regras) {
        try {
            return objectMapper.writeValueAsString(regras);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Falha ao salvar a agenda.", e);
        }
    }

    private List<RegraHorarioDTO> readRules(String json) {
        try {
            if (json == null || json.isBlank()) {
                return defaultRules();
            }
            RegraHorarioDTO[] array = objectMapper.readValue(json, RegraHorarioDTO[].class);
            List<RegraHorarioDTO> regras = new ArrayList<>();
            Collections.addAll(regras, array);
            return regras;
        } catch (Exception e) {
            return defaultRules();
        }
    }

    private List<RegraHorarioDTO> defaultRules() {
        return List.of(
            new RegraHorarioDTO("MONDAY", true, LocalTime.of(8, 0), LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(18, 0)),
            new RegraHorarioDTO("TUESDAY", true, LocalTime.of(8, 0), LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(18, 0)),
            new RegraHorarioDTO("WEDNESDAY", true, LocalTime.of(8, 0), LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(18, 0)),
            new RegraHorarioDTO("THURSDAY", true, LocalTime.of(8, 0), LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(18, 0)),
            new RegraHorarioDTO("FRIDAY", true, LocalTime.of(8, 0), LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(18, 0))
        );
    }
}
