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
  id?: number;
  dataHora: string;
  cliente?: AgendamentoClienteResumo;
  status?: string;
}

export interface AgendaProfissionalOption {
  id: number | string;
  nome: string;
}

export interface AgendaPacienteOption {
  id: number | string;
  nome: string;
}