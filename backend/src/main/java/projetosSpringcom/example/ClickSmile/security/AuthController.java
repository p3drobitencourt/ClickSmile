package projetosSpringcom.example.ClickSmile.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.security.dto.LoginRequest;
import projetosSpringcom.example.ClickSmile.security.dto.LoginResponse;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;

import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final UsuarioRepository usuarioRepository;
    private final RegistrationService registrationService;

    public AuthController(AuthenticationManager authenticationManager,
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

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@RequestBody RegisterRequest request, HttpServletResponse response) {
        Usuario usuario = registrationService.register(request);
        String access = jwtService.createAccessToken(usuario);
        refreshTokenService.createRefreshToken(usuario, response);
        return ResponseEntity.ok(new LoginResponse(access, usuario.getEmail(), usuario.getPerfil()));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email(), request.senha())
        );

        Optional<Usuario> u = usuarioRepository.findByEmail(request.email());
        if (u.isEmpty()) return ResponseEntity.status(401).build();

        Usuario usuario = u.get();
        String access = jwtService.createAccessToken(usuario);
        refreshTokenService.createRefreshToken(usuario, response);

        return ResponseEntity.ok(new LoginResponse(access, usuario.getEmail(), usuario.getPerfil()));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie c : cookies) {
                if ("refreshToken".equals(c.getName())) {
                    String raw = c.getValue();
                    refreshTokenService.findByRaw(raw).ifPresent(rt -> refreshTokenService.revokeToken(rt));
                }
            }
        }
        Cookie clear = new Cookie("refreshToken", "");
        clear.setHttpOnly(true);
        clear.setPath("/api/auth");
        clear.setMaxAge(0);
        response.addCookie(clear);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) return ResponseEntity.status(401).build();
        String raw = null;
        for (Cookie c : cookies) {
            if ("refreshToken".equals(c.getName())) {
                raw = c.getValue();
                break;
            }
        }
        if (raw == null) return ResponseEntity.status(401).build();

        var optToken = refreshTokenService.findByRaw(raw);
        if (optToken.isEmpty()) return ResponseEntity.status(401).build();
        var tokenEntity = optToken.get();
        var usuario = tokenEntity.getUsuario();
        // revoke the used token (rotation)
        refreshTokenService.revokeToken(tokenEntity);
        String access = jwtService.createAccessToken(usuario);
        refreshTokenService.createRefreshToken(usuario, response);
        return ResponseEntity.ok(new LoginResponse(access, usuario.getEmail(), usuario.getPerfil()));
    }
}
