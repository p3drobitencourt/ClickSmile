package projetosSpringcom.example.ClickSmile.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import projetosSpringcom.example.ClickSmile.security.dto.LoginRequest;
import projetosSpringcom.example.ClickSmile.security.dto.LoginResponse;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;
import projetosSpringcom.example.ClickSmile.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final projetosSpringcom.example.ClickSmile.repository.UsuarioRepository usuarioRepository;

    public AuthController(AuthService authService, projetosSpringcom.example.ClickSmile.repository.UsuarioRepository usuarioRepository) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/debug-login")
    public ResponseEntity<?> debugLogin(@RequestParam String email) {
        try {
            java.util.List<Object[]> rows = usuarioRepository.findAuthUserByEmailBypassingRls(email);
            if (rows.isEmpty()) return ResponseEntity.ok("NOT_FOUND");
            Object[] row = rows.get(0);
            return ResponseEntity.ok(java.util.Map.of(
                "id", row[0] != null ? row[0].toString() : "null",
                "email", row[1] != null ? row[1].toString() : "null",
                "senhaHash", row[2] != null ? row[2].toString() : "null",
                "tenantId", row[3] != null ? row[3].toString() : "null",
                "perfil", row[4] != null ? row[4].toString() : "null",
                "status", row[5] != null ? row[5].toString() : "null"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(400).body(e.getMessage());
        }
    }

    @PostMapping("/register")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        LoginResponse loginResponse = authService.register(request, response);
        return ResponseEntity.ok(loginResponse);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request, HttpServletResponse response) {
        try {
            LoginResponse loginResponse = authService.login(request, response);
            return ResponseEntity.ok(loginResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).build();
        }
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request, HttpServletResponse response) {
        authService.logout(request, response);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/refresh")
    public ResponseEntity<LoginResponse> refresh(HttpServletRequest request, HttpServletResponse response) {
        try {
            LoginResponse loginResponse = authService.refresh(request, response);
            return ResponseEntity.ok(loginResponse);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(401).build();
        }
    }
}
