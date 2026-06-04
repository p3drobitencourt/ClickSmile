package projetosSpringcom.example.ClickSmile.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.service.AgendaService;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.domain.StatusAgendamento;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import java.util.UUID;
import projetosSpringcom.example.ClickSmile.repository.AgendamentoRepository;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.dto.AgendaResponseDTO;
import projetosSpringcom.example.ClickSmile.dto.RegraHorarioDTO;
import projetosSpringcom.example.ClickSmile.dto.SlotResponseDTO;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;
    private final PacienteRepository pacienteRepository;
    private final AgendaService agendaService;

    public AgendamentoService(AgendamentoRepository agendamentoRepository, UsuarioRepository usuarioRepository, PacienteRepository pacienteRepository, AgendaService agendaService) {
        this.agendamentoRepository = agendamentoRepository;
        this.usuarioRepository = usuarioRepository;
        this.pacienteRepository = pacienteRepository;
        this.agendaService = agendaService;
    }

    @Transactional
    public Agendamento criar(AgendamentoRequestDTO dto) {
        var fimAt = dto.dataHora().plusMinutes(30);

        if (!agendaService.slotPermitido(dto.dentistaId(), dto.dataHora(), fimAt)) {
            throw new IllegalStateException("Horário indisponível para a agenda desse dentista.");
        }

        agendamentoRepository.findByDentistaAndInicioAtForUpdate(dto.dentistaId(), dto.dataHora())
            .ifPresent(a -> { throw new AgendamentoConflictException("Horário indisponível (concorrência detectada)."); });

        Paciente paciente = pacienteRepository.findById(dto.clienteId())
            .orElseThrow(() -> new IllegalArgumentException("Paciente não encontrado."));
        Dentista dentista = (Dentista) usuarioRepository.findById(dto.dentistaId())
            .orElseThrow(() -> new IllegalArgumentException("Dentista não encontrado."));

        Agendamento agendamento = new Agendamento();
        agendamento.setPaciente(paciente);
        agendamento.setDentista(dentista);
        agendamento.setInicioAt(dto.dataHora());
        // default slot duration: 30 minutes (could be read from Agenda in future)
        agendamento.setFimAt(fimAt);
        agendamento.setStatus(StatusAgendamento.CONFIRMADO);

        return agendamentoRepository.save(agendamento);
    }

    @Transactional
    public void cancelar(UUID id) {
        Agendamento agendamento = agendamentoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado."));
        
        agendamento.setStatus(StatusAgendamento.CANCELADO);
        agendamentoRepository.save(agendamento);
    }

    @Transactional
    public Agendamento reagendar(UUID id, OffsetDateTime novoInicio) {
        Agendamento agendamento = agendamentoRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Agendamento não encontrado."));

        if (agendamento.getStatus() == StatusAgendamento.CANCELADO) {
            throw new IllegalStateException("Não é possível reagendar um agendamento cancelado.");
        }

        var fimAt = novoInicio.plusMinutes(30);

        if (!agendaService.slotPermitido(agendamento.getDentista().getId(), novoInicio, fimAt)) {
            throw new IllegalStateException("Novo horário indisponível para a agenda desse dentista.");
        }

        agendamentoRepository.findByDentistaAndInicioAtForUpdate(agendamento.getDentista().getId(), novoInicio)
            .ifPresent(a -> {
                if (!a.getId().equals(agendamento.getId())) {
                    throw new AgendamentoConflictException("Horário indisponível (concorrência detectada).");
                }
            });

        agendamento.setInicioAt(novoInicio);
        agendamento.setFimAt(fimAt);
        return agendamentoRepository.save(agendamento);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> listarPorDentista(UUID dentistaId) {
        return agendamentoRepository.findByDentistaId(dentistaId);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> listarPorPaciente(UUID pacienteId) {
        return agendamentoRepository.findByPacienteIdOrderByInicioAtDesc(pacienteId);
    }

    @Transactional(readOnly = true)
    public List<SlotResponseDTO> buscarSlotsLivres(UUID dentistaId, LocalDate inicio, LocalDate fim) {
        AgendaResponseDTO agenda = agendaService.buscarPorDentista(dentistaId);
        List<RegraHorarioDTO> regras = agenda.regras();
        if (regras == null || regras.isEmpty()) {
            return List.of();
        }

        ZoneId zone = ZoneId.of(agenda.timezone() != null ? agenda.timezone() : "America/Sao_Paulo");
        int slotDuration = agenda.slotDurationMin() != null ? agenda.slotDurationMin() : 30;

        OffsetDateTime rangeStart = inicio.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime rangeEnd = fim.plusDays(1).atStartOfDay(zone).toOffsetDateTime();

        List<Agendamento> agendamentos = agendamentoRepository.findByDentistaIdAndDataRange(dentistaId, rangeStart, rangeEnd);
        List<SlotResponseDTO> slots = new ArrayList<>();

        for (LocalDate date = inicio; !date.isAfter(fim); date = date.plusDays(1)) {
            String dayOfWeek = date.getDayOfWeek().name();
            RegraHorarioDTO rule = regras.stream()
                .filter(r -> r.ativo() && dayOfWeek.equalsIgnoreCase(r.diaSemana()))
                .findFirst().orElse(null);

            if (rule == null) continue;

            LocalTime cursor = rule.inicio();
            LocalTime end = rule.fim();

            while (cursor.plusMinutes(slotDuration).compareTo(end) <= 0) {
                LocalTime next = cursor.plusMinutes(slotDuration);
                
                boolean insidePause = rule.pausaInicio() != null && rule.pausaFim() != null &&
                        (cursor.compareTo(rule.pausaInicio()) >= 0 && cursor.compareTo(rule.pausaFim()) < 0 ||
                         next.compareTo(rule.pausaInicio()) > 0 && next.compareTo(rule.pausaFim()) <= 0 ||
                         cursor.compareTo(rule.pausaInicio()) <= 0 && next.compareTo(rule.pausaFim()) >= 0);

                if (insidePause) {
                    cursor = rule.pausaFim();
                    continue;
                }

                OffsetDateTime slotStart = date.atTime(cursor).atZone(zone).toOffsetDateTime();
                OffsetDateTime slotEnd = date.atTime(next).atZone(zone).toOffsetDateTime();

                boolean isOccupied = agendamentos.stream().anyMatch(a ->
                    a.getInicioAt().compareTo(slotStart) == 0 ||
                    (a.getInicioAt().isBefore(slotEnd) && a.getFimAt().isAfter(slotStart))
                );

                if (!isOccupied && slotStart.isAfter(OffsetDateTime.now())) {
                    slots.add(new SlotResponseDTO(slotStart, slotEnd, "Disponível", "success"));
                }

                cursor = next;
            }
        }

        return slots;
    }
}