package projetosSpringcom.example.ClickSmile.integration;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import projetosSpringcom.example.ClickSmile.config.WebSocketConfig;
import projetosSpringcom.example.ClickSmile.security.TenantContext;

import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.*;

public class WebSocketInterceptorTest {

    private WebSocketConfig webSocketConfig;
    private JwtDecoder jwtDecoder;

    @BeforeEach
    public void setup() {
        jwtDecoder = mock(JwtDecoder.class);
        webSocketConfig = new WebSocketConfig(jwtDecoder);
        TenantContext.clear();
    }

    @AfterEach
    public void cleanup() {
        TenantContext.clear();
    }

    @Test
    public void testWebSocketInterceptorPropagatesTenantId() {
        // Arrange
        UUID fakeTenantId = UUID.randomUUID();
        Jwt mockJwt = mock(Jwt.class);
        when(mockJwt.getSubject()).thenReturn("user-123");
        when(mockJwt.getClaimAsString("tenantId")).thenReturn(fakeTenantId.toString());
        when(jwtDecoder.decode("valid-token")).thenReturn(mockJwt);

        // Simulando a configuração e o ChannelInterceptor
        org.springframework.messaging.simp.config.ChannelRegistration registration = 
            new org.springframework.messaging.simp.config.ChannelRegistration();
        webSocketConfig.configureClientInboundChannel(registration);
        
        org.springframework.messaging.support.ChannelInterceptor interceptor = null;
        try {
            java.lang.reflect.Field field = org.springframework.messaging.simp.config.ChannelRegistration.class.getDeclaredField("interceptors");
            field.setAccessible(true);
            java.util.List<org.springframework.messaging.support.ChannelInterceptor> interceptors = 
                (java.util.List<org.springframework.messaging.support.ChannelInterceptor>) field.get(registration);
            interceptor = interceptors.get(0);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }

        // Cria mensagem STOMP CONNECT com o token
        StompHeaderAccessor accessor = StompHeaderAccessor.create(StompCommand.CONNECT);
        accessor.setNativeHeader("Authorization", "Bearer valid-token");
        accessor.setSessionAttributes(new java.util.HashMap<>());
        Message<?> message = MessageBuilder.createMessage(new byte[0], accessor.getMessageHeaders());
        
        MessageChannel channel = mock(MessageChannel.class);

        // Act (preSend)
        interceptor.preSend(message, channel);

        // Assert (O interceptor deve ter extraído o tenantId do token e setado no Context)
        assertEquals(fakeTenantId, TenantContext.getTenantId(), "O interceptor deve configurar o TenantContext a partir do JWT via WebSocket CONNECT");

        // Act (afterSendCompletion)
        interceptor.afterSendCompletion(message, channel, true, null);

        // Assert (O interceptor deve ter limpado o contexto)
        assertNull(TenantContext.getTenantId(), "O interceptor deve limpar o TenantContext após o processamento da mensagem");
    }
}
