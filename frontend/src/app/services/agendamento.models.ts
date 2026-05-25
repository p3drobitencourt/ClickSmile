export interface AgendamentoRequest {
  clienteId: number;
  dentistaId: number;
  dataHora: string;
}

export interface AgendamentoClienteResumo {
  id?: number;
  nome?: string;
}

export interface AgendamentoResumo {
  id?: number;
  dataHora: string;
  cliente?: AgendamentoClienteResumo;
  status?: string;
}

export interface AgendaProfissionalOption {
  id: number;
  nome: string;
}

export interface AgendaPacienteOption {
  id: number;
  nome: string;
}