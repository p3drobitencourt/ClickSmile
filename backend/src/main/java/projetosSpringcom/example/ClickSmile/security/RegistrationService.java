package projetosSpringcom.example.ClickSmile.security;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.PacienteUsuario;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.Perfil;
import projetosSpringcom.example.ClickSmile.domain.TenantClinica;
import projetosSpringcom.example.ClickSmile.domain.Usuario;
import projetosSpringcom.example.ClickSmile.repository.TenantClinicaRepository;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;
import projetosSpringcom.example.ClickSmile.security.TenantContext;

import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
public class RegistrationService {

    private final UsuarioRepository usuarioRepository;
    private final TenantClinicaRepository tenantRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    public RegistrationService(UsuarioRepository usuarioRepository,
                               TenantClinicaRepository tenantRepository,
                               PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tenantRepository = tenantRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario register(RegisterRequest request) {
        if (usuarioRepository.findByEmail(request.email()).isPresent()) {
            throw new IllegalArgumentException("Já existe um usuário com este e-mail.");
        }

        Perfil perfil = request.perfil();
        if (perfil == Perfil.TENANT_ADMIN) {
            throw new IllegalArgumentException("Cadastro público não pode criar TENANT_ADMIN.");
        }

        TenantClinica tenant = new TenantClinica();
        tenant.setId(UUID.randomUUID());
        tenant.setCnpj(null);
        tenant.setRazaoSocial(resolveRazaoSocial(request));
        tenant.setNomeFantasia(resolveNomeFantasia(request));
        tenant.setStatus("ACTIVE");
        tenant.setTimezone("America/Sao_Paulo");
        tenant.setCreatedAt(OffsetDateTime.now());
        tenant.setUpdatedAt(OffsetDateTime.now());
        tenantRepository.save(tenant);

        Usuario usuario = createUsuario(perfil, request);
        usuario.setTenantId(tenant.getId());
        usuario.setEmail(request.email());
        usuario.setSenha(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(perfil);

        TenantContext.setTenantId(tenant.getId());
        try {
            return usuarioRepository.save(usuario);
        } finally {
            TenantContext.clear();
        }
    }

    private Usuario createUsuario(Perfil perfil, RegisterRequest request) {
        if (perfil == Perfil.DENTISTA) {
            if (isBlank(request.cro()) || isBlank(request.especialidade())) {
                throw new IllegalArgumentException("Para dentista, informe CRO e especialidade.");
            }
            Dentista dentista = new Dentista();
            dentista.setNome(request.nome());
            dentista.setCro(request.cro().trim());
            dentista.setEspecialidade(request.especialidade().trim());
            return dentista;
        }

        if (isBlank(request.telefone())) {
            throw new IllegalArgumentException("Para paciente, informe o telefone.");
        }
        PacienteUsuario pacienteUsuario = new PacienteUsuario();
        pacienteUsuario.setNome(request.nome());
        pacienteUsuario.setTelefone(request.telefone().trim());
        return pacienteUsuario;
    }

    private String resolveRazaoSocial(RegisterRequest request) {
        String nomeClinica = request.nomeClinica();
        if (!isBlank(nomeClinica)) {
            return nomeClinica.trim();
        }
        return "";
    }

    private String resolveNomeFantasia(RegisterRequest request) {
        String nomeClinica = request.nomeClinica();
        if (!isBlank(nomeClinica)) {
            return nomeClinica.trim();
        }
        return "";
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
