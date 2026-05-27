package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.TenantClinica;

import java.util.UUID;

public interface TenantClinicaRepository extends JpaRepository<TenantClinica, UUID> {
}
