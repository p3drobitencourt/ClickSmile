package projetosSpringcom.example.ClickSmile.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import projetosSpringcom.example.ClickSmile.domain.TenantClinica;

import java.util.Optional;
import java.util.UUID;

public interface TenantClinicaRepository extends JpaRepository<TenantClinica, UUID> {
    Optional<TenantClinica> findByCnpj(String cnpj);
}
