package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.transaction.annotation.Transactional;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.domain.TenantClinica;
import projetosSpringcom.example.ClickSmile.dto.DentistaPerfilDTO;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;
import projetosSpringcom.example.ClickSmile.repository.TenantClinicaRepository;

import java.util.UUID;
import java.util.Optional;

@RestController
@RequestMapping("/api/dentistas")
public class DentistaPerfilController {

    private final UsuarioRepository usuarioRepository;
    private final TenantClinicaRepository tenantClinicaRepository;

    public DentistaPerfilController(UsuarioRepository usuarioRepository, TenantClinicaRepository tenantClinicaRepository) {
        this.usuarioRepository = usuarioRepository;
        this.tenantClinicaRepository = tenantClinicaRepository;
    }

    @GetMapping("/{id}/perfil")
    public ResponseEntity<DentistaPerfilDTO> getPerfil(@PathVariable UUID id) {
        return usuarioRepository.findById(id)
                .filter(Dentista.class::isInstance)
                .map(Dentista.class::cast)
                .map(d -> {
                    java.math.BigDecimal lat = null;
                    java.math.BigDecimal lon = null;
                    if (d.getTenantId() != null) {
                        Optional<TenantClinica> tc = tenantClinicaRepository.findById(d.getTenantId());
                        if (tc.isPresent()) {
                            lat = tc.get().getLatitude();
                            lon = tc.get().getLongitude();
                        }
                    }
                    return new DentistaPerfilDTO(
                        d.getId(),
                        d.getNome(),
                        d.getEspecialidade(),
                        d.getBio(),
                        d.getClinica(),
                        d.getTelefone(),
                        d.getCep(),
                        d.getLogradouro(),
                        d.getNumero(),
                        d.getComplemento(),
                        d.getBairro(),
                        d.getCidade(),
                        d.getEstado(),
                        lat,
                        lon
                    );
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/perfil")
    @Transactional
    public ResponseEntity<DentistaPerfilDTO> updatePerfil(@PathVariable UUID id, @RequestBody DentistaPerfilDTO dto) {
        return usuarioRepository.findById(id)
                .filter(Dentista.class::isInstance)
                .map(Dentista.class::cast)
                .map(d -> {
                    d.setNome(dto.nome());
                    d.setEspecialidade(dto.especialidade());
                    d.setBio(dto.bio());
                    d.setClinica(dto.clinica());
                    d.setTelefone(dto.telefone());
                    d.setCep(dto.cep());
                    d.setLogradouro(dto.logradouro());
                    d.setNumero(dto.numero());
                    d.setComplemento(dto.complemento());
                    d.setBairro(dto.bairro());
                    d.setCidade(dto.cidade());
                    d.setEstado(dto.estado());
                    Dentista saved = usuarioRepository.save(d);

                    java.math.BigDecimal lat = null;
                    java.math.BigDecimal lon = null;
                    if (d.getTenantId() != null) {
                        Optional<TenantClinica> tcOpt = tenantClinicaRepository.findById(d.getTenantId());
                        if (tcOpt.isPresent()) {
                            TenantClinica tc = tcOpt.get();
                            if (dto.latitude() != null) tc.setLatitude(dto.latitude());
                            if (dto.longitude() != null) tc.setLongitude(dto.longitude());
                            tenantClinicaRepository.save(tc);
                            lat = tc.getLatitude();
                            lon = tc.getLongitude();
                        }
                    }

                    return new DentistaPerfilDTO(
                            saved.getId(),
                            saved.getNome(),
                            saved.getEspecialidade(),
                            saved.getBio(),
                            saved.getClinica(),
                            saved.getTelefone(),
                            saved.getCep(),
                            saved.getLogradouro(),
                            saved.getNumero(),
                            saved.getComplemento(),
                            saved.getBairro(),
                            saved.getCidade(),
                            saved.getEstado(),
                            lat,
                            lon
                    );
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
