package projetosSpringcom.example.ClickSmile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "dentista")
@Data
@EqualsAndHashCode(callSuper = true)
public class Dentista extends Usuario {



    @NotBlank(message = "O CRO é obrigatório.")
    @Column(nullable = false, unique = true, length = 20)
    private String cro;

    @NotBlank(message = "A especialidade é obrigatória.")
    @Column(nullable = false)
    private String especialidade;
}