package projetosSpringcom.example.ClickSmile.controller;

import jakarta.validation.Valid;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;

import projetosSpringcom.example.ClickSmile.dto.ChatMessageDTO;
import projetosSpringcom.example.ClickSmile.dto.ChatMessageRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.ChatInviteRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.SessaoChatRequestDTO;
import projetosSpringcom.example.ClickSmile.dto.SessaoChatResponseDTO;
import projetosSpringcom.example.ClickSmile.domain.SessaoChatStatus;
import projetosSpringcom.example.ClickSmile.service.ChatService;

import java.util.UUID;
import java.util.List;
import java.util.Map;

@Controller
public class ChatController {

    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    @MessageMapping("/chat.send")
    public void send(@Valid ChatMessageRequestDTO request) {
        ChatMessageDTO response = chatService.processAndSaveMessage(request);
        if (response != null) {
            messagingTemplate.convertAndSendToUser(request.recipientId().toString(), "/queue/mensagens", response);
            messagingTemplate.convertAndSendToUser(request.senderId().toString(), "/queue/mensagens", response);
        }
    }

    @MessageMapping("/chat.invite")
    public void invite(@Valid ChatInviteRequestDTO request) {
        ChatMessageDTO response = chatService.processAndSaveInvite(request);
        if (response != null) {
            messagingTemplate.convertAndSendToUser(request.clienteId().toString(), "/queue/mensagens", response);
            messagingTemplate.convertAndSendToUser(request.dentistaId().toString(), "/queue/mensagens", response);
        }
    }

    @GetMapping("/api/mensagens/historico/{roomId}")
    @ResponseBody
    public ResponseEntity<?> getHistorico(@PathVariable String roomId) {
        org.springframework.security.core.Authentication auth = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        
        String userIdStr;
        if (auth.getPrincipal() instanceof org.springframework.security.oauth2.jwt.Jwt) {
            userIdStr = ((org.springframework.security.oauth2.jwt.Jwt) auth.getPrincipal()).getSubject();
        } else {
            userIdStr = auth.getName();
        }
        UUID userId = UUID.fromString(userIdStr);

        try {
            List<ChatMessageDTO> mensagens = chatService.getHistorico(roomId, userId);
            return ResponseEntity.ok(mensagens);
        } catch (SecurityException e) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(e.getMessage());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/api/chat/iniciar")
    public ResponseEntity<?> iniciarSessao(@RequestBody SessaoChatRequestDTO request) {
        try {
            SessaoChatResponseDTO response = chatService.iniciarSessao(request);
            if (response.status() == SessaoChatStatus.PENDING) {
                messagingTemplate.convertAndSendToUser(request.dentistaId().toString(), "/queue/solicitacoes", response);
            }
            return ResponseEntity.ok(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(e.getMessage());
        }
    }


    @PostMapping("/api/chat/sessao/{roomId}/aceitar")
    public ResponseEntity<SessaoChatResponseDTO> aceitarSessao(@PathVariable String roomId) {
        ChatService.AceitarSessaoResult result = chatService.aceitarSessao(roomId);
        
        messagingTemplate.convertAndSendToUser(result.sessaoInfo().clienteId().toString(), "/queue/mensagens", result.systemMessage());
        messagingTemplate.convertAndSendToUser(result.sessaoInfo().clienteId().toString(), "/queue/status", result.sessaoInfo());
        messagingTemplate.convertAndSendToUser(result.sessaoInfo().dentistaId().toString(), "/queue/status", result.sessaoInfo());
        messagingTemplate.convertAndSendToUser(result.sessaoInfo().dentistaId().toString(), "/queue/agendamentos", result.agendamentoInfo());

        return ResponseEntity.ok(result.sessaoInfo());
    }

    @PostMapping("/api/chat/sessao/{roomId}/agendar")
    public ResponseEntity<?> agendarConvite(@PathVariable String roomId, @RequestBody Map<String, String> payload) {
        try {
            ChatService.AgendarConviteResult result = chatService.agendarConvite(roomId, payload.get("dataHora"));

            messagingTemplate.convertAndSendToUser(result.clienteId().toString(), "/queue/mensagens", result.systemMessage());
            messagingTemplate.convertAndSendToUser(result.dentistaId().toString(), "/queue/mensagens", result.systemMessage());
            messagingTemplate.convertAndSendToUser(result.dentistaId().toString(), "/queue/agendamentos", result.agendamentoInfo());

            return ResponseEntity.status(HttpStatus.CREATED).build();
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }
}
