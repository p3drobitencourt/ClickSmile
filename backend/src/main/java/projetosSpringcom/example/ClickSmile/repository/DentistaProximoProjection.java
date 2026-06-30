package projetosSpringcom.example.ClickSmile.repository;

import java.math.BigDecimal;
import java.util.UUID;

public interface DentistaProximoProjection {
    String getId();
    String getNome();
    String getEmail();
    String getCro();
    String getEspecialidade();
    BigDecimal getLatitude();
    BigDecimal getLongitude();
    Double getDistanciaKm();
}
