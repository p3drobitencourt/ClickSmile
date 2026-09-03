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
import projetosSpringcom.example.ClickSmile.repository.PacienteRepository;
import projetosSpringcom.example.ClickSmile.repository.DentistaRepository;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import projetosSpringcom.example.ClickSmile.security.dto.RegisterRequest;

import java.time.OffsetDateTime;
import java.util.Locale;
import java.util.UUID;

@Service
public class RegistrationService {

    private final UsuarioRepository usuarioRepository;
    private final TenantClinicaRepository tenantRepository;
    private final PacienteRepository pacienteRepository;
    private final DentistaRepository dentistaRepository;
    private final PasswordEncoder passwordEncoder;

    public RegistrationService(UsuarioRepository usuarioRepository,
                               TenantClinicaRepository tenantRepository,
                               PacienteRepository pacienteRepository,
                               DentistaRepository dentistaRepository,
                               PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.tenantRepository = tenantRepository;
        this.pacienteRepository = pacienteRepository;
        this.dentistaRepository = dentistaRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public Usuario register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (!usuarioRepository.findAuthUserByEmailBypassingRls(email).isEmpty()) {
            throw new IllegalArgumentException("Já existe um usuário com este e-mail.");
        }

        Perfil perfil = request.perfil();
        TenantClinica tenant;

        if (perfil == Perfil.TENANT_ADMIN || perfil == Perfil.DENTISTA) {
            
            if (isBlank(request.nomeClinica())) {
                throw new IllegalArgumentException("O nome da clínica é obrigatório.");
            }

            String cnpj = request.cnpj() == null ? "" : request.cnpj().replaceAll("\\D", "");
            if (cnpj.length() != 14) {
                throw new IllegalArgumentException("O CNPJ da clínica deve conter 14 dígitos.");
            }

            if (tenantRepository.findByCnpj(cnpj).isPresent()) {
                throw new IllegalArgumentException("Já existe uma clínica com este CNPJ.");
            }

            if (perfil == Perfil.DENTISTA) {
                if (isBlank(request.cro()) || isBlank(request.especialidade())) {
                    throw new IllegalArgumentException("Para dentista, informe CRO e especialidade.");
                }
                String cro = request.cro().trim();
                if (dentistaRepository.existsByCro(cro)) {
                    throw new IllegalArgumentException("Já existe um dentista com este CRO.");
                }
            }

            tenant = createTenant(request, cnpj);
        } else if (perfil == Perfil.PACIENTE) {
            if (request.tenantId() == null) {
                throw new IllegalArgumentException("É obrigatório selecionar uma clínica para o cadastro do paciente.");
            }
            tenant = tenantRepository.findById(request.tenantId())
                    .orElseThrow(() -> new IllegalArgumentException("Clínica não encontrada."));
        } else {
            throw new IllegalArgumentException("O perfil informado não pode ser criado pelo cadastro público.");
        }

        Usuario usuario = createUsuario(perfil, request);
        usuario.setTenantId(tenant.getId());
        usuario.setEmail(email);
        usuario.setSenha(passwordEncoder.encode(request.senha()));
        usuario.setPerfil(perfil);

        TenantContext.setTenantId(tenant.getId());
        try {
            Usuario savedUsuario = usuarioRepository.save(usuario);

            if (savedUsuario instanceof PacienteUsuario pu) {
                Paciente paciente = new Paciente();
                paciente.setNome(pu.getNome());
                paciente.setPacienteUsuario(pu);
                paciente.setTenantId(tenant.getId());
                paciente.setCreatedAt(OffsetDateTime.now());
                pacienteRepository.save(paciente);
            }

            return savedUsuario;
        } finally {
            TenantContext.clear();
        }
    }

    private TenantClinica createTenant(RegisterRequest request, String cnpj) {
        TenantClinica tenant = new TenantClinica();
        tenant.setId(UUID.randomUUID());
        tenant.setCnpj(cnpj);
        tenant.setRazaoSocial(request.nomeClinica().trim());
        tenant.setNomeFantasia(request.nomeClinica().trim());
        tenant.setStatus("ACTIVE");
        tenant.setTimezone("America/Sao_Paulo");
        tenant.setCreatedAt(OffsetDateTime.now());
        tenant.setUpdatedAt(OffsetDateTime.now());
        return tenantRepository.save(tenant);
    }

    private Usuario createUsuario(Perfil perfil, RegisterRequest request) {
        if (perfil == Perfil.TENANT_ADMIN) {
            Usuario admin = new Usuario();
            admin.setNome(request.nome().trim());
            return admin;
        }

        if (perfil == Perfil.DENTISTA) {
            Dentista dentista = new Dentista();
            dentista.setNome(request.nome().trim());
            dentista.setCro(request.cro().trim());
            dentista.setEspecialidade(request.especialidade().trim());
            return dentista;
        }

        if (isBlank(request.telefone())) {
            throw new IllegalArgumentException("Para paciente, informe o telefone.");
        }
        PacienteUsuario pacienteUsuario = new PacienteUsuario();
        pacienteUsuario.setNome(request.nome().trim());
        pacienteUsuario.setTelefone(request.telefone().replaceAll("\\D", ""));
        return pacienteUsuario;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}
