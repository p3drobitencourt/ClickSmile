package projetosSpringcom.example.ClickSmile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AgendaDiaDentistaDTO {
    private UUID dentistaId;
    private String dentistaNome;
    private List<AgendamentoResponseDTO> agendamentos;
}
