package projetosSpringcom.example.ClickSmile.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.repository.AuthUserProjection;

import java.util.Collections;

@Service
public class CustomUserDetailsService implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public CustomUserDetailsService(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        java.util.List<Object[]> rows = usuarioRepository.findAuthUserByEmailBypassingRls(username);
        if (rows.isEmpty()) {
            throw new UsernameNotFoundException("Usuário não encontrado: " + username);
        }
        
        Object[] row = rows.get(0);
        // SELECT id, email, senha_hash, tenant_id, perfil, status
        String email = row[1] != null ? row[1].toString() : null;
        String senhaHash = row[2] != null ? row[2].toString() : null;
        String perfil = row[4] != null ? row[4].toString() : null;
        
        GrantedAuthority auth = new SimpleGrantedAuthority("ROLE_" + perfil);
        return new User(email, senhaHash, Collections.singletonList(auth));
    }
}
