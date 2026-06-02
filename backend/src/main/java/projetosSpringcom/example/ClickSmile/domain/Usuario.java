package projetosSpringcom.example.ClickSmile.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

@Entity
@Table(name = "usuario")
@Inheritance(strategy = InheritanceType.JOINED) // Estratégia crucial: Cria uma tabela 'usuario' separada, e as filhas terão chaves estrangeiras apontando para cá.
@Data // Anotação do Lombok (no seu build.gradle) que gera Getters e Setters implicitamente em tempo de compilação.
public abstract class Usuario {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @NotBlank(message = "O e-mail não pode estar vazio.")
    @Email(message = "O formato do e-mail é inválido.")
    @Column(nullable = false, unique = true) // Regra de SGBD: Impede duplicidade a nível de banco de dados.
    private String email;

    @NotBlank(message = "A senha não pode estar vazia.")
    @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres.")
    @Column(name = "senha_hash", nullable = false)
    private String senha;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Perfil perfil;

    @NotBlank(message = "O nome é obrigatório.")
    @Column(nullable = false)
    private String nome;

    @Column(nullable = false)
    private String status = "ACTIVE";
}