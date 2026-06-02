package projetosSpringcom.example.ClickSmile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminUsuarioDTO {
    private UUID id;
    private String nome;
    private String email;
    private String perfil;
    private String status;
}
