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

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(length = 255)
    private String clinica;

    @Column(length = 50)
    private String telefone;

    @Column(length = 9)
    private String cep;

    @Column(length = 255)
    private String logradouro;

    @Column(length = 20)
    private String numero;

    @Column(length = 100)
    private String complemento;

    @Column(length = 100)
    private String bairro;

    @Column(length = 100)
    private String cidade;

    @Column(length = 2)
    private String estado;
}