package projetosSpringcom.example.ClickSmile.domain;

import jakarta.persistence.*;
import lombok.Data;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.GenericGenerator;

import java.util.UUID;

import projetosSpringcom.example.ClickSmile.security.TenantEntityListener;
import projetosSpringcom.example.ClickSmile.security.TenantAware;

@Entity
@Table(name = "paciente")
@Data
@EntityListeners(TenantEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class Paciente implements TenantAware {

    @Id
    @GeneratedValue(generator = "UUID")
    @GenericGenerator(name = "UUID", strategy = "org.hibernate.id.UUIDGenerator")
    @Column(columnDefinition = "uuid", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 160)
    private String nome;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = true)
    private PacienteUsuario pacienteUsuario;
}
