export interface AgendamentoRequest {
  clienteId: number | string;
  dentistaId: number | string;
  dataHora: string;
}

export interface AgendamentoClienteResumo {
  id?: number;
  nome?: string;
}

export interface AgendamentoResumo {
  id?: number | string;
  pacienteId?: string;
  pacienteNome?: string;
  dentistaId?: string;
  dentistaNome?: string;
  inicioAt: string;
  fimAt?: string;
  status?: string;
  observacoes?: string;
}

export interface AgendaProfissionalOption {
  id: number | string;
  nome: string;
}

export interface AgendaPacienteOption {
  id: number | string;
  nome: string;
}