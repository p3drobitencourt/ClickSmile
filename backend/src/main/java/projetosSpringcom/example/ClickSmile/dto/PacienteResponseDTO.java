package projetosSpringcom.example.ClickSmile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PacienteResponseDTO {
    private UUID id;
    private String nome;
    private String email;
    private String telefone;
}
