package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import java.util.UUID;

public interface PacienteRepository extends JpaRepository<Paciente, UUID> {
}
