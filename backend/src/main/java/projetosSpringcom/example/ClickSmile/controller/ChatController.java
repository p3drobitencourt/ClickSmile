package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import projetosSpringcom.example.ClickSmile.domain.Mensagem;
import projetosSpringcom.example.ClickSmile.repository.MensagemRepository;
import projetosSpringcom.example.ClickSmile.dto.ChatMessageDTO;
import projetosSpringcom.example.ClickSmile.dto.ChatMessageRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.ChatInviteRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.SessaoChatRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.SessaoChatResponseDTO;
import projetosSpringcom.example.ClickSmile.dto.AgendamentoRequestDTO;
import projetosSpringcom.example.ClickSmile.domain.SessaoChat;
import projetosSpringcom.example.ClickSmile.domain.SessaoChatStatus;
import projetosSpringcom.example.ClickSmile.repository.SessaoChatRepository;
import projetosSpringcom.example.ClickSmile.service.AgendamentoService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.dao.DataIntegrityViolationException;
import java.time.format.DateTimeFormatter;

import java.util.UUID;
import java.util.List;
import java.util.stream.Collectors;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MensagemRepository mensagemRepository;
    private final SessaoChatRepository sessaoChatRepository;
    private final AgendamentoService agendamentoService;

    public ChatController(SimpMessagingTemplate messagingTemplate, MensagemRepository mensagemRepository, SessaoChatRepository sessaoChatRepository, AgendamentoService agendamentoService) {
        this.messagingTemplate = messagingTemplate;
        this.mensagemRepository = mensagemRepository;
        this.sessaoChatRepository = sessaoChatRepository;
        this.agendamentoService = agendamentoService;
    }

    @MessageMapping("/chat.send")
    public void send(@Valid ChatMessageRequestDTO request) {
        // Validation: Verify if session is ACTIVE
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(request.roomId())).orElse(null);
        if (sessao == null || sessao.getStatus() != SessaoChatStatus.ACTIVE) {
            // Drop message if session is not active
            return;
        }

        Mensagem msg = new Mensagem();
        msg.setRoomId(request.roomId());
        msg.setSenderId(request.senderId());
        msg.setSenderName(request.senderName());
        msg.setRecipientId(request.recipientId());
        msg.setContent(request.message());
        msg.setSentAt(request.sentAt() != null ? request.sentAt() : java.time.OffsetDateTime.now());
        
        msg = mensagemRepository.save(msg);

        ChatMessageDTO response = new ChatMessageDTO(
            msg.getId(),
            msg.getRoomId(),
            msg.getSenderId(),
            msg.getSenderName(),
            msg.getRecipientId(),
            msg.getContent(),
            msg.getSentAt()
        );

        messagingTemplate.convertAndSend("/topic/chat." + request.roomId(), response);
    }

    @MessageMapping("/chat.invite")
    public void invite(@Valid ChatInviteRequestDTO request) {
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(request.roomId())).orElse(null);
        if (sessao == null || sessao.getStatus() != SessaoChatStatus.ACTIVE) {
            return;
        }

        String jsonPayload = "{\"dataHora\":\"" + request.dataHora().format(DateTimeFormatter.ISO_OFFSET_DATE_TIME) + "\"}";
        String content = "[INVITE]" + jsonPayload;

        Mensagem msg = new Mensagem();
        msg.setRoomId(request.roomId());
        msg.setSenderId(request.dentistaId());
        msg.setSenderName(request.dentistaNome());
        msg.setRecipientId(request.clienteId());
        msg.setContent(content);
        msg.setSentAt(java.time.OffsetDateTime.now());
        
        msg = mensagemRepository.save(msg);

        ChatMessageDTO response = new ChatMessageDTO(
            msg.getId(),
            msg.getRoomId(),
            msg.getSenderId(),
            msg.getSenderName(),
            msg.getRecipientId(),
            msg.getContent(),
            msg.getSentAt()
        );

        messagingTemplate.convertAndSend("/topic/chat." + request.roomId(), response);
    }

    @GetMapping("/api/mensagens/historico/{roomId}")
    @ResponseBody
    public List<ChatMessageDTO> getHistorico(@PathVariable String roomId) {
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

    @PostMapping("/api/chat/iniciar")
    public ResponseEntity<?> iniciarSessao(@RequestBody SessaoChatRequestDTO request) {
        try {
            SessaoChat sessao = sessaoChatRepository.findByClienteIdAndDentistaId(request.clienteId(), request.dentistaId())
                .orElseGet(() -> {
                    SessaoChat novaSessao = new SessaoChat();
                    novaSessao.setClienteId(request.clienteId());
                    novaSessao.setDentistaId(request.dentistaId());
                    novaSessao.setStatus(SessaoChatStatus.PENDING);
                    return sessaoChatRepository.save(novaSessao);
                });

            SessaoChatResponseDTO response = new SessaoChatResponseDTO(sessao.getId(), sessao.getClienteId(), sessao.getDentistaId(), sessao.getStatus());

            if (sessao.getStatus() == SessaoChatStatus.PENDING) {
                messagingTemplate.convertAndSend("/topic/dentista." + request.dentistaId() + ".solicitacoes", response);
            }

            return ResponseEntity.ok(response);
        } catch (DataIntegrityViolationException e) {
            // Se houve inserção concorrente exata que acionou a constraint UNIQUE
            return ResponseEntity.status(HttpStatus.CONFLICT).body("Sessão já criada simultaneamente. Tente novamente.");
        }
    }

    @MessageMapping("/chat.iniciar")
    public void iniciarSessaoStomp(@Valid SessaoChatRequestDTO request) {
        try {
            SessaoChat sessao = sessaoChatRepository.findByClienteIdAndDentistaId(request.clienteId(), request.dentistaId())
                .orElseGet(() -> {
                    SessaoChat novaSessao = new SessaoChat();
                    novaSessao.setClienteId(request.clienteId());
                    novaSessao.setDentistaId(request.dentistaId());
                    novaSessao.setStatus(SessaoChatStatus.PENDING);
                    return sessaoChatRepository.save(novaSessao);
                });

            SessaoChatResponseDTO response = new SessaoChatResponseDTO(sessao.getId(), sessao.getClienteId(), sessao.getDentistaId(), sessao.getStatus());

            if (sessao.getStatus() == SessaoChatStatus.PENDING) {
                messagingTemplate.convertAndSend("/topic/dentista." + request.dentistaId() + ".solicitacoes", response);
            }
        } catch (DataIntegrityViolationException e) {
            // Drop silently or broadcast error for STOMP
        }
    }

    @PostMapping("/api/chat/sessao/{roomId}/aceitar")
    public ResponseEntity<SessaoChatResponseDTO> aceitarSessao(@PathVariable String roomId) {
        SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(roomId))
            .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));

        sessao.setStatus(SessaoChatStatus.ACTIVE);
        sessao = sessaoChatRepository.save(sessao);

        SessaoChatResponseDTO response = new SessaoChatResponseDTO(sessao.getId(), sessao.getClienteId(), sessao.getDentistaId(), sessao.getStatus());
        messagingTemplate.convertAndSend("/topic/chat." + roomId + ".status", response);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/api/chat/sessao/{roomId}/agendar")
    @Transactional
    public ResponseEntity<?> agendarConvite(@PathVariable String roomId, @RequestBody java.util.Map<String, String> payload) {
        try {
            SessaoChat sessao = sessaoChatRepository.findById(UUID.fromString(roomId))
                .orElseThrow(() -> new IllegalArgumentException("Sessão não encontrada"));

            if (sessao.getStatus() != SessaoChatStatus.ACTIVE) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body("A sessão de chat não está ativa.");
            }

            java.time.OffsetDateTime dataHora = java.time.OffsetDateTime.parse(payload.get("dataHora"), DateTimeFormatter.ISO_OFFSET_DATE_TIME);
            AgendamentoRequestDTO req = new AgendamentoRequestDTO(sessao.getClienteId(), sessao.getDentistaId(), dataHora);
            agendamentoService.criar(req);

            // Enviar mensagem automática de sucesso para o chat
            Mensagem msg = new Mensagem();
            msg.setRoomId(roomId);
            msg.setSenderId(sessao.getClienteId());
            msg.setSenderName("Sistema");
            msg.setRecipientId(sessao.getDentistaId());
            msg.setContent("[SYSTEM] Agendamento confirmado para " + dataHora.format(DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm")) + ".");
            msg.setSentAt(java.time.OffsetDateTime.now());
            mensagemRepository.save(msg);

            ChatMessageDTO responseMsg = new ChatMessageDTO(
                msg.getId(), msg.getRoomId(), msg.getSenderId(), msg.getSenderName(), msg.getRecipientId(), msg.getContent(), msg.getSentAt()
            );
            messagingTemplate.convertAndSend("/topic/chat." + roomId, responseMsg);

            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
