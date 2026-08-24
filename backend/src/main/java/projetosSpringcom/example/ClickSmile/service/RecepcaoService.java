package projetosSpringcom.example.ClickSmile.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.repository.AgendamentoRepository;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoResponseDTO;

import java.util.List;
import java.util.UUID;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
public class RecepcaoService {

    private final PacienteRepository pacienteRepository;
    private final UsuarioRepository usuarioRepository;
    private final AgendamentoRepository agendamentoRepository;

    public RecepcaoService(PacienteRepository pacienteRepository, UsuarioRepository usuarioRepository, AgendamentoRepository agendamentoRepository) {
        this.pacienteRepository = pacienteRepository;
        this.usuarioRepository = usuarioRepository;
        this.agendamentoRepository = agendamentoRepository;
    }

    @Transactional(readOnly = true)
    public List<Paciente> listarPacientesDaClinica() {
        return pacienteRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> listarAgendasDoDia(LocalDate data) {
        ZoneId zone = ZoneId.of("America/Sao_Paulo");
        OffsetDateTime inicioDia = data.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime fimDia = data.plusDays(1).atStartOfDay(zone).toOffsetDateTime();

        List<Dentista> dentistas = usuarioRepository.findByPerfil(Perfil.DENTISTA)
                .stream()
                .filter(Dentista.class::isInstance)
                .map(Dentista.class::cast)
                .toList();

        List<Map<String, Object>> resultado = new java.util.ArrayList<>();

        for (Dentista dentista : dentistas) {
            List<AgendamentoResponseDTO> agendamentos = agendamentoRepository
                    .findByDentistaIdAndDataRange(dentista.getId(), inicioDia, fimDia)
                    .stream()
                    .map(a -> new AgendamentoResponseDTO(
                            a.getId(),
                            a.getPaciente().getId(),
                            a.getPaciente().getNome(),
                            a.getDentista().getId(),
                            a.getDentista().getNome(),
                            a.getInicioAt(),
                            a.getFimAt(),
                            a.getStatus(),
                            a.getObservacoes()
                    ))
                    .toList();

            Map<String, Object> dentistaAgenda = new HashMap<>();
            dentistaAgenda.put("dentistaId", dentista.getId());
            dentistaAgenda.put("dentistaNome", dentista.getNome());
            dentistaAgenda.put("agendamentos", agendamentos);
            resultado.add(dentistaAgenda);
        }

        return resultado;
    }
}
