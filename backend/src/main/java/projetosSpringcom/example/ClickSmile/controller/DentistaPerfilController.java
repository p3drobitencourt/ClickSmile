package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import projetosSpringcom.example.ClickSmile.domain.Dentista;
import projetosSpringcom.example.ClickSmile.dto.DentistaPerfilDTO;
import projetosSpringcom.example.ClickSmile.repository.UsuarioRepository;

import java.util.UUID;

@RestController
@RequestMapping("/api/dentistas")
public class DentistaPerfilController {

    private final UsuarioRepository usuarioRepository;

    public DentistaPerfilController(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/{id}/perfil")
    public ResponseEntity<DentistaPerfilDTO> getPerfil(@PathVariable UUID id) {
        return usuarioRepository.findById(id)
                .filter(Dentista.class::isInstance)
                .map(Dentista.class::cast)
                .map(d -> new DentistaPerfilDTO(
                        d.getId(),
                        d.getNome(),
                        d.getEspecialidade(),
                        d.getBio(),
                        d.getClinica(),
                        d.getTelefone(),
                        d.getEndereco()
                ))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PutMapping("/{id}/perfil")
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
                    d.setEndereco(dto.endereco());
                    Dentista saved = usuarioRepository.save(d);
                    return new DentistaPerfilDTO(
                            saved.getId(),
                            saved.getNome(),
                            saved.getEspecialidade(),
                            saved.getBio(),
                            saved.getClinica(),
                            saved.getTelefone(),
                            saved.getEndereco()
                    );
                })
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
