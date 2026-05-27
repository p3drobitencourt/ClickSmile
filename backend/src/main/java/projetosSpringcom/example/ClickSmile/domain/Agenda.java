package projetosSpringcom.example.ClickSmile.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import org.hibernate.annotations.GenericGenerator;

import java.time.LocalTime;
import java.util.UUID;

@Entity
@Table(name = "agenda")
@Data
public class Agenda {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "dentista_usuario_id", nullable = false)
    private UUID dentistaUsuarioId;

    @Column(nullable = false)
    private String timezone = "America/Sao_Paulo";

    @Column(name = "slot_duration_min", nullable = false)
    private Integer slotDurationMin = 30;

    @Column(name = "hora_inicio_padrao", nullable = false)
    private LocalTime horaInicioPadrao = LocalTime.of(8, 0);

    @Column(name = "hora_fim_padrao", nullable = false)
    private LocalTime horaFimPadrao = LocalTime.of(18, 0);

    @Column(name = "regra_semana", nullable = false, columnDefinition = "jsonb")
    private String regraSemanaJson = "[]";

    @Column(nullable = false)
    private boolean ativo = true;
}
