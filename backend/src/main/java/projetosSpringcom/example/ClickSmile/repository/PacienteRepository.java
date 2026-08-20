package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.Paciente;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import java.util.Optional;

public interface PacienteRepository extends JpaRepository<Paciente, UUID> {

    @Query("SELECT p FROM Paciente p WHERE p.id = :id")
    Optional<Paciente> findById(@Param("id") UUID id);

    @Modifying
    @Query("DELETE FROM Paciente p WHERE p.id = :id")
    void deleteById(@Param("id") UUID id);
}
