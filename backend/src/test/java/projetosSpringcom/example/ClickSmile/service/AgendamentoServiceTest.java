package projetosSpringcom.example.ClickSmile.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import projetosSpringcom.example.ClickSmile.domain.Agendamento;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.domain.StatusAgendamento;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.repository.AgendamentoRepository;
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AgendamentoServiceTest {

    @Mock
    private AgendamentoRepository agendamentoRepository;

    @Mock
    private UsuarioRepository usuarioRepository;

    @Mock
    private PacienteRepository pacienteRepository;

    @Mock
    private AgendaService agendaService;

    private AgendamentoService service;

    @BeforeEach
    void setUp() {
        service = new AgendamentoService(agendamentoRepository, usuarioRepository, pacienteRepository, agendaService);
    }

    @Test
    void criarDeveSalvarAgendamentoConfirmadoQuandoSlotForValido() {
        UUID pacienteId = UUID.randomUUID();
        UUID dentistaId = UUID.randomUUID();
        LocalDateTime inicio = LocalDateTime.now().plusDays(2).withHour(10).withMinute(0).withSecond(0).withNano(0);

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO(pacienteId, dentistaId, inicio);
        Paciente paciente = new Paciente();
        paciente.setId(pacienteId);
        Dentista dentista = new Dentista();
        dentista.setId(dentistaId);
        dentista.setNome("Dr. Teste");
        dentista.setCro("CRO-0001");
        dentista.setEspecialidade("Clínica Geral");

        when(agendaService.slotPermitido(eq(dentistaId), eq(inicio), eq(inicio.plusMinutes(30)))).thenReturn(true);
        when(agendamentoRepository.findByDentistaAndInicioAtForUpdate(dentistaId, inicio)).thenReturn(Optional.empty());
        when(pacienteRepository.findById(pacienteId)).thenReturn(Optional.of(paciente));
        when(usuarioRepository.findById(dentistaId)).thenReturn(Optional.of(dentista));
        when(agendamentoRepository.save(any(Agendamento.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Agendamento salvo = service.criar(dto);

        assertEquals(StatusAgendamento.CONFIRMADO, salvo.getStatus());
        assertEquals(inicio.plusMinutes(30), salvo.getFimAt());
        assertEquals(inicio, salvo.getInicioAt());
        verify(agendamentoRepository).save(any(Agendamento.class));
    }

    @Test
    void criarDeveBloquearQuandoAgendaNaoPermite() {
        UUID pacienteId = UUID.randomUUID();
        UUID dentistaId = UUID.randomUUID();
        LocalDateTime inicio = LocalDateTime.now().plusDays(2).withHour(11).withMinute(0).withSecond(0).withNano(0);

        when(agendaService.slotPermitido(eq(dentistaId), eq(inicio), eq(inicio.plusMinutes(30)))).thenReturn(false);

        AgendamentoRequestDTO dto = new AgendamentoRequestDTO(pacienteId, dentistaId, inicio);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.criar(dto));
        assertTrue(ex.getMessage().contains("Horário indisponível"));
        verifyNoInteractions(agendamentoRepository, pacienteRepository, usuarioRepository);
    }
}
