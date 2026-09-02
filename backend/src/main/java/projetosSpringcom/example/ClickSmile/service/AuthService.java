package projetosSpringcom.example.ClickSmile.service;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.security.JwtService;
import projetosSpringcom.example.ClickSmile.security.RefreshTokenService;
import projetosSpringcom.example.ClickSmile.security.RegistrationService;
import projetosSpringcom.example.ClickSmile.security.TenantContext;
import projetosSpringcom.example.ClickSmile.security.dto.LoginRequest;
import projetosSpringcom.example.ClickSmile.security.dto.LoginResponse;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;

@Service
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UsuarioRepository usuarioRepository;
    private final RegistrationService registrationService;

    public AuthService(AuthenticationManager authenticationManager,
                       JwtService jwtService,
                       RefreshTokenService refreshTokenService,
                       UsuarioRepository usuarioRepository,
                       RegistrationService registrationService) {
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.usuarioRepository = usuarioRepository;
        this.registrationService = registrationService;
    }

    @Transactional
    public LoginResponse register(RegisterRequest request, HttpServletResponse response) {
        Usuario usuario = registrationService.register(request);
        
        TenantContext.setTenantId(usuario.getTenantId());
        try {
            String access = jwtService.createAccessToken(usuario);
            refreshTokenService.createRefreshToken(usuario, response);
            return new LoginResponse(access, usuario.getEmail(), usuario.getPerfil());
        } finally {
            TenantContext.clear();
        }
    }

    @Transactional
    public LoginResponse login(LoginRequest request, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        var rows = usuarioRepository.findAuthUserByEmailBypassingRls(request.email());
        if (rows.isEmpty()) {
            throw new IllegalArgumentException("Credenciais inválidas");
        }

        Object[] authUser = rows.get(0);
        // SELECT id, email, senha_hash, tenant_id, perfil, status
        java.util.UUID authId = (java.util.UUID) authUser[0];
        java.util.UUID tenantId = (java.util.UUID) authUser[3];

        TenantContext.setTenantId(tenantId);
        try {
            Usuario usuario = usuarioRepository.findById(authId)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
            
            String access = jwtService.createAccessToken(usuario);
            refreshTokenService.createRefreshToken(usuario, response);
            return new LoginResponse(access, usuario.getEmail(), usuario.getPerfil());
        } finally {
            TenantContext.clear();
        }
    }

    @Transactional
    public LoginResponse refresh(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) throw new IllegalArgumentException("No cookies");
        
        String raw = null;
        for (Cookie c : cookies) {
            if ("refreshToken".equals(c.getName())) {
                raw = c.getValue();
                break;
            }
        }
        if (raw == null) throw new IllegalArgumentException("Token missing");

        var optToken = refreshTokenService.findByRaw(raw);
        if (optToken.isEmpty()) {
            throw new IllegalArgumentException("Invalid refresh token");
        }
        
        try {
            var tokenEntity = optToken.get();
            var usuario = tokenEntity.getUsuario();
            
            // Atomically revoke old token and create new one
            refreshTokenService.revokeToken(tokenEntity);
            String access = jwtService.createAccessToken(usuario);
            refreshTokenService.createRefreshToken(usuario, response);
            
            return new LoginResponse(access, usuario.getEmail(), usuario.getPerfil());
        } finally {
            TenantContext.clear();
        }
    }

    @Transactional
    public void logout(HttpServletRequest request, HttpServletResponse response) {
        try {
            Cookie[] cookies = request.getCookies();
            if (cookies != null) {
                for (Cookie c : cookies) {
                    if ("refreshToken".equals(c.getName())) {
                        String raw = c.getValue();
                        refreshTokenService.findByRaw(raw).ifPresent(rt -> refreshTokenService.revokeToken(rt));
                    }
                }
            }
            refreshTokenService.clearRefreshTokenCookie(response);
            org.springframework.security.core.context.SecurityContextHolder.clearContext();
        } finally {
            TenantContext.clear();
        }
    }
}
