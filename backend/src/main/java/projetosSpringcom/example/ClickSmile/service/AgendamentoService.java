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

    @Transactional(readOnly = true)
    public List<Agendamento> listarPorDentista(UUID dentistaId) {
        return agendamentoRepository.findByDentistaId(dentistaId);
    }
}