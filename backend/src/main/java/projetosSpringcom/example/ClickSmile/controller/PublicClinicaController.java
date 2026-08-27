package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import projetosSpringcom.example.ClickSmile.dto.ClinicaPublicResumoDTO;
import projetosSpringcom.example.ClickSmile.repository.TenantClinicaRepository;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/public/clinicas")
public class PublicClinicaController {

    private final TenantClinicaRepository tenantClinicaRepository;

    public PublicClinicaController(TenantClinicaRepository tenantClinicaRepository) {
        this.tenantClinicaRepository = tenantClinicaRepository;
    }

    @GetMapping
    public ResponseEntity<List<ClinicaPublicResumoDTO>> listar() {
        List<ClinicaPublicResumoDTO> clinicas = tenantClinicaRepository.findAll().stream()
                .filter(t -> "ACTIVE".equals(t.getStatus()))
                .map(t -> new ClinicaPublicResumoDTO(t.getId(), t.getNomeFantasia(), t.getCnpj(), t.getLatitude(), t.getLongitude()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(clinicas);
    }
}
