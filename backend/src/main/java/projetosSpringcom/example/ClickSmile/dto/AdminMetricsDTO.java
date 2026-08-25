package projetosSpringcom.example.ClickSmile.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AdminMetricsDTO {
    private long totalPacientes;
    private long novosPacientes;
    private long totalDentistas;
    private long totalAgendamentos;
    private long agendamentosConcluidos;
    private long agendamentosCancelados;
    private double taxaCancelamento;
}
