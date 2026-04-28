package projetosSpringcom.example.ClickSmile.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import projetosSpringcom.example.ClickSmile.domain.Cliente;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.StatusAgendamento;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.repository.AgendamentoRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import java.util.List;

@Service
public class AgendamentoService {

    private final AgendamentoRepository agendamentoRepository;
    private final UsuarioRepository usuarioRepository;

    public AgendamentoService(AgendamentoRepository agendamentoRepository, UsuarioRepository usuarioRepository) {
        this.agendamentoRepository = agendamentoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public Agendamento criar(AgendamentoRequestDTO dto) {
        agendamentoRepository.findByDentistaAndDataHoraForUpdate(dto.dentistaId(), dto.dataHora())
                .ifPresent(a -> { throw new IllegalStateException("Horário indisponível (Lock de concorrência acionado)."); });

        Cliente cliente = (Cliente) usuarioRepository.findById(dto.clienteId())
                .orElseThrow(() -> new IllegalArgumentException("Cliente não encontrado."));
        Dentista dentista = (Dentista) usuarioRepository.findById(dto.dentistaId())
                .orElseThrow(() -> new IllegalArgumentException("Dentista não encontrado."));

        Agendamento agendamento = new Agendamento();
        agendamento.setCliente(cliente);
        agendamento.setDentista(dentista);
        agendamento.setDataHora(dto.dataHora());
        agendamento.setStatus(StatusAgendamento.CONFIRMADO);

        return agendamentoRepository.save(agendamento);
    }

    @Transactional(readOnly = true)
    public List<Agendamento> listarPorDentista(Long dentistaId) {
        return agendamentoRepository.findByDentistaId(dentistaId);
    }
}