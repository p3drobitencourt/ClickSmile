package projetosSpringcom.example.ClickSmile.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Mensagem;
import projetosSpringcom.example.ClickSmile.domain.SessaoChat;
import projetosSpringcom.example.ClickSmile.domain.SessaoChatStatus;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.dto.*;
import projetosSpringcom.example.ClickSmile.repository.MensagemRepository;
import projetosSpringcom.example.ClickSmile.repository.SessaoChatRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ChatService {

    private final MensagemRepository mensagemRepository;
    private final SessaoChatRepository sessaoChatRepository;
    private final AgendamentoService agendamentoService;
    private final UsuarioRepository usuarioRepository;

    public ChatService(MensagemRepository mensagemRepository, SessaoChatRepository sessaoChatRepository, AgendamentoService agendamentoService, UsuarioRepository usuarioRepository) {
        this.mensagemRepository = mensagemRepository;
        this.sessaoChatRepository = sessaoChatRepository;
        this.agendamentoService = agendamentoService;
        this.usuarioRepository = usuarioRepository;
    }

    @Transactional
    public ChatMessageDTO processAndSaveMessage(ChatMessageRequestDTO request) {
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(request.roomId())).orElse(null);
        if (sessao == null || sessao.getStatus() != SessaoChatStatus.ACTIVE) {
            return null; // Ignore if not active
        }

        Mensagem msg = new Mensagem();
        msg.setRoomId(request.roomId());
        msg.setSenderId(request.senderId());
        msg.setSenderName(request.senderName());
        msg.setRecipientId(request.recipientId());
        msg.setContent(request.message());
        msg.setSentAt(request.sentAt() != null ? request.sentAt() : OffsetDateTime.now());

        msg = mensagemRepository.save(msg);

        return new ChatMessageDTO(
                msg.getId(),
                msg.getRoomId(),
                msg.getSenderId(),
                msg.getSenderName(),
                msg.getRecipientId(),
                msg.getContent(),
                msg.getSentAt()
        );
    }

    @Transactional
    public ChatMessageDTO processAndSaveInvite(ChatInviteRequestDTO request) {
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(request.roomId())).orElse(null);
        if (sessao == null || sessao.getStatus() != SessaoChatStatus.ACTIVE) {
            return null;
        }

        String jsonPayload = "{\"dataHora\":\"" + request.dataHora().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) + "\"}";
        String content = "[INVITE]" + jsonPayload;

        Mensagem msg = new Mensagem();
        msg.setRoomId(request.roomId());
        msg.setSenderId(request.dentistaId());
        msg.setSenderName(request.dentistaNome());
        msg.setRecipientId(request.clienteId());
        msg.setContent(content);
        msg.setSentAt(OffsetDateTime.now());

        msg = mensagemRepository.save(msg);

        return new ChatMessageDTO(
                msg.getId(),
                msg.getRoomId(),
                msg.getSenderId(),
                msg.getSenderName(),
                msg.getRecipientId(),
                msg.getContent(),
                msg.getSentAt()
        );
    }

    @Transactional(readOnly = true)
    public List<ChatMessageDTO> getHistorico(String roomId, UUID userId) {
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(roomId))
                .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));

        if (!sessao.getClienteId().equals(userId) && !sessao.getDentistaId().equals(userId)) {
            throw new SecurityException("Acesso negado: você não pertence a este chat.");
        }

        return mensagemRepository.findByRoomIdOrderBySentAtAsc(roomId).stream()
                .map(msg -> new ChatMessageDTO(
                        msg.getId(),
                        msg.getRoomId(),
                        msg.getSenderId(),
                        msg.getSenderName(),
                        msg.getRecipientId(),
                        msg.getContent(),
                        msg.getSentAt()
                ))
                .collect(Collectors.toList());
    }

    @Transactional
    public SessaoChatResponseDTO iniciarSessao(SessaoChatRequestDTO request) {
        try {
            SessaoChat sessao = sessaoChatRepository.findByClienteIdAndDentistaId(request.clienteId(), request.dentistaId())
                    .orElseGet(() -> {
                        SessaoChat novaSessao = new SessaoChat();
                        novaSessao.setClienteId(request.clienteId());
                        novaSessao.setDentistaId(request.dentistaId());
                        novaSessao.setStatus(SessaoChatStatus.PENDING);
                        return sessaoChatRepository.save(novaSessao);
                    });
            return new SessaoChatResponseDTO(sessao.getId(), sessao.getClienteId(), sessao.getDentistaId(), sessao.getStatus());
        } catch (DataIntegrityViolationException e) {
            throw new IllegalStateException("Sessão já criada simultaneamente. Tente novamente.");
        }
    }

    public record AceitarSessaoResult(SessaoChatResponseDTO sessaoInfo, ChatMessageDTO systemMessage, Map<String, Object> agendamentoInfo) {}

    @Transactional
    public AceitarSessaoResult aceitarSessao(String roomId) {
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(roomId))
                .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));

        AgendamentoResponseDTO agendamento = agendamentoService.aceitarPaciente(sessao.getClienteId(), sessao.getDentistaId());

        SessaoChatResponseDTO sessaoInfo = new SessaoChatResponseDTO(sessao.getId(), sessao.getClienteId(), sessao.getDentistaId(), SessaoChatStatus.ACTIVE);

        Mensagem msg = new Mensagem();
        msg.setRoomId(sessao.getId().toString());
        msg.setSenderId(sessao.getDentistaId());
        msg.setSenderName("Sistema");
        msg.setRecipientId(sessao.getClienteId());
        msg.setContent("[SYSTEM] Avaliação Inicial agendada automaticamente para amanhã às 08:00.");
        msg.setSentAt(OffsetDateTime.now());
        mensagemRepository.save(msg);

        ChatMessageDTO systemMessage = new ChatMessageDTO(msg.getId(), msg.getRoomId(), msg.getSenderId(), msg.getSenderName(), msg.getRecipientId(), msg.getContent(), msg.getSentAt());

        Map<String, Object> agendamentoInfo = buildAgendamentoInfoMap(agendamento);

        return new AceitarSessaoResult(sessaoInfo, systemMessage, agendamentoInfo);
    }

    public record AgendarConviteResult(ChatMessageDTO systemMessage, Map<String, Object> agendamentoInfo, UUID clienteId, UUID dentistaId) {}

    @Transactional
    public AgendarConviteResult agendarConvite(String roomId, String dataHoraStr) {
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(roomId))
                .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));

        if (sessao.getStatus() != SessaoChatStatus.ACTIVE) {
            throw new IllegalStateException("A sessão de chat não está ativa.");
        }

        OffsetDateTime dataHora = OffsetDateTime.parse(dataHoraStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
        AgendamentoRequestDTO req = new AgendamentoRequestDTO(sessao.getClienteId(), sessao.getDentistaId(), dataHora);
        AgendamentoResponseDTO agendamento = agendamentoService.criar(req);

        Mensagem msg = new Mensagem();
        msg.setRoomId(roomId);
        msg.setSenderId(sessao.getClienteId());
        msg.setSenderName("Sistema");
        msg.setRecipientId(sessao.getDentistaId());
        msg.setContent("[SYSTEM] Agendamento confirmado para " + dataHora.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + ".");
        msg.setSentAt(OffsetDateTime.now());
        mensagemRepository.save(msg);

        ChatMessageDTO systemMessage = new ChatMessageDTO(msg.getId(), msg.getRoomId(), msg.getSenderId(), msg.getSenderName(), msg.getRecipientId(), msg.getContent(), msg.getSentAt());
        Map<String, Object> agendamentoInfo = buildAgendamentoInfoMap(agendamento);

        return new AgendarConviteResult(systemMessage, agendamentoInfo, sessao.getClienteId(), sessao.getDentistaId());
    }

    public List<SessaoChatDetalheDTO> getSessoesPorUsuario(UUID userId) {
        List<SessaoChat> sessoes = sessaoChatRepository.findByParticipanteId(userId);
        List<SessaoChatDetalheDTO> detalhes = new java.util.ArrayList<>();

        for (SessaoChat s : sessoes) {
            String clienteNome = "Paciente";
            String dentistaNome = "Dentista";
            
            Usuario cliente = usuarioRepository.findById(s.getClienteId()).orElse(null);
            if (cliente != null) clienteNome = cliente.getNome();

            Usuario dentista = usuarioRepository.findById(s.getDentistaId()).orElse(null);
            if (dentista != null) dentistaNome = dentista.getNome();

            detalhes.add(new SessaoChatDetalheDTO(
                s.getId(),
                s.getClienteId(),
                clienteNome,
                s.getDentistaId(),
                dentistaNome,
                s.getStatus()
            ));
        }

        return detalhes;
    }

    private Map<String, Object> buildAgendamentoInfoMap(AgendamentoResponseDTO agendamento) {
        Map<String, Object> dtoAgendamento = new HashMap<>();
        dtoAgendamento.put("id", agendamento.id());
        dtoAgendamento.put("dentistaId", agendamento.dentistaId());
        dtoAgendamento.put("clienteId", agendamento.pacienteId());
        Usuario cliente = usuarioRepository.findById(agendamento.pacienteId()).orElse(null);
        dtoAgendamento.put("clienteNome", cliente != null ? cliente.getNome() : "Desconhecido");
        dtoAgendamento.put("inicioAt", agendamento.inicioAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        dtoAgendamento.put("fimAt", agendamento.fimAt().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME));
        return dtoAgendamento;
    }
}
