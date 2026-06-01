package projetosSpringcom.example.ClickSmile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "cliente")
@Data
@EqualsAndHashCode(callSuper = true) // Instrui o Lombok a considerar os campos da classe pai (Usuario) no equals/hashCode.
public class Cliente extends Usuario {



    @NotBlank(message = "O telefone é obrigatório.")
    @Column(nullable = false, length = 15)
    private String telefone;
}