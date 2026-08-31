package projetosSpringcom.example.ClickSmile.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;

import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Serviço transacional para operações de usuário.
 *
 * A presença de @Transactional aqui é ARQUITETURALMENTE OBRIGATÓRIA:
 * o TenantAspect (Order=1) executa ANTES do TransactionInterceptor (Order=MAX_VALUE)
 * quando intercepta métodos do pacote "repository". Sem uma transação já aberta pelo
 * service, o SET LOCAL app.tenant_id executado pelo TenantAspect não persiste na
 * conexão JDBC (comportamento de SET LOCAL fora de TX com autoCommit=true),
 * fazendo a RLS do PostgreSQL bloquear todas as linhas do tenant correto.
 *
 * Fluxo garantido por esta classe:
 *   1. TransactionInterceptor abre TX (por @Transactional neste service)
 *   2. TenantAspect intercepta o método do repository já com TX ativa
 *   3. session.doWork(SET LOCAL app.tenant_id) persiste na conexão da TX
 *   4. session.enableFilter("tenantFilter") ativa na Session correta
 *   5. SELECT/INSERT executam com RLS passando tenant_id correto
 */
@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;

    public UsuarioService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Retorna o perfil do usuário pelo UUID extraído do JWT.
     * @Transactional(readOnly=true) garante que o SET LOCAL do TenantAspect
     * seja executado dentro da transação antes da query RLS.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> getProfile(UUID id) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        return Map.of(
            "id",       usuario.getId(),
            "email",    usuario.getEmail(),
            "perfil",   usuario.getPerfil(),
            "tenantId", usuario.getTenantId()
        );
    }

    /**
     * Retorna usuário por ID com isolamento de tenant via RLS.
     */
    @Transactional(readOnly = true)
    public Usuario findById(UUID id) {
        return usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
    }

    /**
     * Atualiza dados básicos do usuário com proteção de tenant.
     */
    @Transactional
    public void update(UUID id, Map<String, String> body) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        if (body.containsKey("nome"))  usuario.setNome(body.get("nome"));
        if (body.containsKey("email")) usuario.setEmail(body.get("email"));
        usuarioRepository.save(usuario);
    }

    /**
     * Lista todos os usuários do tenant (filtrado via RLS).
     */
    @Transactional(readOnly = true)
    public List<Usuario> findAll() {
        return usuarioRepository.findAll();
    }

    /**
     * Conta usuários por perfil dentro do tenant.
     */
    @Transactional(readOnly = true)
    public long countByPerfil(Perfil perfil) {
        return usuarioRepository.countByPerfil(perfil);
    }

    /**
     * Lista usuários por perfil dentro do tenant.
     */
    @Transactional(readOnly = true)
    public List<Usuario> findByPerfil(Perfil perfil) {
        return usuarioRepository.findByPerfil(perfil);
    }

    /**
     * Altera o status de um usuário (ACTIVE / BLOCKED).
     */
    @Transactional
    public void updateStatus(UUID id, String newStatus) {
        Usuario usuario = usuarioRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Usuário não encontrado."));
        usuario.setStatus(newStatus);
        usuarioRepository.save(usuario);
    }
}
