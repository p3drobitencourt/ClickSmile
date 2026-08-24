package projetosSpringcom.example.ClickSmile.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import projetosSpringcom.example.ClickSmile.dto.DentistaResumoDTO;
import projetosSpringcom.example.ClickSmile.service.PublicDiscoveryService;

import java.util.List;

@RestController
@RequestMapping("/api/public/dentistas")
public class DentistaPublicController {

    private final PublicDiscoveryService publicDiscoveryService;

    public DentistaPublicController(PublicDiscoveryService publicDiscoveryService) {
        this.publicDiscoveryService = publicDiscoveryService;
    }

    @GetMapping
    public ResponseEntity<List<DentistaResumoDTO>> listar(
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double lat,
            @org.springframework.web.bind.annotation.RequestParam(required = false) Double lng
    ) {
        List<DentistaResumoDTO> dados = publicDiscoveryService.buscarDentistas(lat, lng);
        return ResponseEntity.ok(dados);
    }
}
