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
import projetosSpringcom.example.ClickSmile.dto.PacienteResponseDTO;
import projetosSpringcom.example.ClickSmile.dto.AgendaDiaDentistaDTO;
import projetosSpringcom.example.ClickSmile.domain.PacienteUsuario;

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
    public List<PacienteResponseDTO> listarPacientesDaClinica() {
        return pacienteRepository.findAll().stream()
            .map(p -> {
                String email = null;
                String telefone = null;
                if (p.getPacienteUsuario() != null) {
                    email = p.getPacienteUsuario().getEmail();
                    if (p.getPacienteUsuario() instanceof PacienteUsuario) {
                        telefone = ((PacienteUsuario) p.getPacienteUsuario()).getTelefone();
                    }
                }
                return new PacienteResponseDTO(p.getId(), p.getNome(), email, telefone);
            })
            .toList();
    }

    @Transactional(readOnly = true)
    public List<AgendaDiaDentistaDTO> listarAgendasDoDia(LocalDate data) {
        ZoneId zone = ZoneId.of("America/Sao_Paulo");
        OffsetDateTime inicioDia = data.atStartOfDay(zone).toOffsetDateTime();
        OffsetDateTime fimDia = data.plusDays(1).atStartOfDay(zone).toOffsetDateTime();

        List<Dentista> dentistas = usuarioRepository.findByPerfil(Perfil.DENTISTA)
                .stream()
                .filter(Dentista.class::isInstance)
                .map(Dentista.class::cast)
                .toList();

        if (dentistas.isEmpty()) {
            return java.util.Collections.emptyList();
        }

        List<UUID> dentistaIds = dentistas.stream().map(Dentista::getId).toList();

        List<Agendamento> agendamentosBatch = agendamentoRepository
                .findByDentistaIdInAndDataRange(dentistaIds, inicioDia, fimDia);

        Map<UUID, List<AgendamentoResponseDTO>> agrupados = agendamentosBatch.stream()
                .map(a -> new AgendamentoResponseDTO(
                        a.getId(),
                        a.getPaciente().getId(),
                        a.getPaciente().getNome(),
                        a.getDentista().getId(),
                        a.getDentista().getNome(),
                        a.getInicioAt(),
                        a.getFimAt(),
                        a.getStatus(),
                        null // observacoes
                ))
                .collect(Collectors.groupingBy(AgendamentoResponseDTO::dentistaId));

        return dentistas.stream().map(dentista -> {
            List<AgendamentoResponseDTO> agendaDentista = agrupados.getOrDefault(dentista.getId(), java.util.Collections.emptyList());
            return new AgendaDiaDentistaDTO(dentista.getId(), dentista.getNome(), agendaDentista);
        }).toList();
    }
}
