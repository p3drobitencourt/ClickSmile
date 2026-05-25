package projetosSpringcom.example.ClickSmile.domain;

import jakarta.persistence.*;
import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "agendamento")
@Data
public class Agendamento {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @NotNull(message = "O paciente é obrigatório.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "paciente_id", nullable = false)
    private Paciente paciente;

    @NotNull(message = "O dentista é obrigatório.")
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dentista_usuario_id", nullable = false)
    private Dentista dentista;

    @NotNull(message = "A data de início é obrigatória.")
    @Future(message = "A data do agendamento deve ser no futuro.")
    @Column(name = "inicio_at", nullable = false)
    private LocalDateTime inicioAt;

    @NotNull(message = "A data de término é obrigatória.")
    @Column(name = "fim_at", nullable = false)
    private LocalDateTime fimAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusAgendamento status = StatusAgendamento.PENDENTE;
}