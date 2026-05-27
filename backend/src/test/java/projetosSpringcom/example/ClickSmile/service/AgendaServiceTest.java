package projetosSpringcom.example.ClickSmile.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import projetosSpringcom.example.ClickSmile.domain.Agenda;
import projetosSpringcom.example.ClickSmile.dto.AgendaRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.AgendaResponseDTO;
import projetosSpringcom.example.ClickSmile.dto.RegraHorarioDTO;
import projetosSpringcom.example.ClickSmile.repository.AgendaRepository;

import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AgendaServiceTest {

    @Mock
    private AgendaRepository agendaRepository;

    private AgendaService agendaService;

    @BeforeEach
    void setUp() {
        agendaService = new AgendaService(agendaRepository, new ObjectMapper());
    }

    @Test
    void salvarDevePersistirAgendaComRegrasJson() {
        UUID dentistaId = UUID.randomUUID();
        AgendaRequestDTO request = new AgendaRequestDTO(
            dentistaId,
            "America/Sao_Paulo",
            30,
            LocalTime.of(8, 0),
            LocalTime.of(18, 0),
            List.of(new RegraHorarioDTO("MONDAY", true, LocalTime.of(8, 0), LocalTime.of(12, 0), LocalTime.of(13, 0), LocalTime.of(18, 0)))
        );

        when(agendaRepository.findByDentistaUsuarioId(dentistaId)).thenReturn(Optional.empty());
        when(agendaRepository.save(any(Agenda.class))).thenAnswer(invocation -> invocation.getArgument(0));

        AgendaResponseDTO response = agendaService.salvar(request);

        assertEquals(dentistaId, response.dentistaId());
        assertEquals(30, response.slotDurationMin());
        assertEquals(1, response.regras().size());
        assertEquals("MONDAY", response.regras().get(0).diaSemana());
    }

    @Test
    void slotPermitidoDeveBloquearHorarioNaPausa() {
        UUID dentistaId = UUID.randomUUID();
        Agenda agenda = new Agenda();
        agenda.setDentistaUsuarioId(dentistaId);
        agenda.setRegraSemanaJson("[{\"diaSemana\":\"MONDAY\",\"ativo\":true,\"inicio\":\"08:00\",\"pausaInicio\":\"12:00\",\"pausaFim\":\"13:00\",\"fim\":\"18:00\"}]");

        when(agendaRepository.findByDentistaUsuarioId(dentistaId)).thenReturn(Optional.of(agenda));

        boolean permitido = agendaService.slotPermitido(
            dentistaId,
            LocalDateTime.of(2026, 5, 25, 12, 15),
            LocalDateTime.of(2026, 5, 25, 12, 45)
        );

        assertFalse(permitido);
    }

    @Test
    void slotPermitidoDeveAceitarHorarioValido() {
        UUID dentistaId = UUID.randomUUID();
        Agenda agenda = new Agenda();
        agenda.setDentistaUsuarioId(dentistaId);
        agenda.setRegraSemanaJson("[{\"diaSemana\":\"MONDAY\",\"ativo\":true,\"inicio\":\"08:00\",\"pausaInicio\":\"12:00\",\"pausaFim\":\"13:00\",\"fim\":\"18:00\"}]");

        when(agendaRepository.findByDentistaUsuarioId(dentistaId)).thenReturn(Optional.of(agenda));

        boolean permitido = agendaService.slotPermitido(
            dentistaId,
            LocalDateTime.of(2026, 5, 25, 10, 0),
            LocalDateTime.of(2026, 5, 25, 10, 30)
        );

        assertTrue(permitido);
    }
}
