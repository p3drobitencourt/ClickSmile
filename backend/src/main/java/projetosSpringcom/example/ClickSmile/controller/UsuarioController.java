package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.service.UsuarioService;

import java.util.Map;
import java.util.UUID;

/**
 * Controller de usuário — thin layer, delega toda lógica de acesso ao banco
 * para UsuarioService (@Transactional), garantindo que o TenantAspect + RLS
 * funcionem corretamente dentro de uma transação ativa.
 *
 * NÃO acessa repositórios diretamente. Controllers que chamam repositórios sem
 * transação fazem o TenantAspect executar SET LOCAL fora de TX, o que resulta
 * na RLS do PostgreSQL bloqueando as linhas do tenant correto.
 */
@RestController
@RequestMapping("/api/usuarios")
public class UsuarioController {

    private final UsuarioService usuarioService;

    public UsuarioController(UsuarioService usuarioService) {
        this.usuarioService = usuarioService;
    }

    @GetMapping("/me")
    public Map<String, Object> getProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof Jwt)) {
            throw new IllegalStateException("Usuário não autenticado");
        }

        Jwt jwt = (Jwt) authentication.getPrincipal();
        UUID id = UUID.fromString(jwt.getSubject());

        return usuarioService.getProfile(id);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Usuario> findById(@PathVariable UUID id) {
        try {
            return ResponseEntity.ok(usuarioService.findById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> atualizarCadastro(@PathVariable UUID id, @RequestBody Map<String, String> body) {
        try {
            usuarioService.update(id, body);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
