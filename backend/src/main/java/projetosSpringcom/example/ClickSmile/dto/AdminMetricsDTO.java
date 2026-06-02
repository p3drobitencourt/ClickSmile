package projetosSpringcom.example.ClickSmile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminMetricsDTO {
    private long consultasAtivas;
    private long totalDentistas;
    private long volumeCancelamentos;
}
