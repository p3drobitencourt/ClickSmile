/* V7 Mock Data - Seed de Geolocalização, Dentistas e Agendamentos */

/*
=========================================
      TABELA DE CREDENCIAIS DE TESTE
=========================================
| Perfil   | Email                   | Senha  |
|----------|-------------------------|--------|
| Dentista | dentista1@mock.local    | 123456 |
| Dentista | dentista2@mock.local    | 123456 |
| Paciente | paciente1@mock.local    | 123456 |
=========================================
*/

-- Tenants (Clínicas) com Coordenadas para o Google Maps
INSERT INTO tenant_clinica (id, cnpj, razao_social, nome_fantasia, latitude, longitude) VALUES
('11111111-1111-1111-1111-111111111111', '11111111000111', 'Clinica Paulista S.A.', 'ClickSmile Paulista', -23.561684, -46.655981),
('22222222-2222-2222-2222-222222222222', '22222222000122', 'Clinica Ibirapuera S.A.', 'ClickSmile Ibirapuera', -23.587416, -46.657634)
ON CONFLICT (cnpj) DO NOTHING;

-- Usuários Dentistas (Senha: 123456 bcrypt: $2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q)
INSERT INTO usuario (id, tenant_id, email, senha_hash, nome, perfil) VALUES
('d1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'dentista1@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Dr. Carlos Mendes (Paulista)', 'DENTISTA'),
('d2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'dentista2@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Dra. Fernanda Lima (Paulista)', 'DENTISTA'),
('d3000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'dentista3@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Dr. João Pedro (Ibirapuera)', 'DENTISTA'),
('d4000000-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'dentista4@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Dra. Ana Souza (Ibirapuera)', 'DENTISTA'),
('d5000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'dentista5@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Dr. Ricardo Gomes (Paulista)', 'DENTISTA')
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Tabela Dentista Específica
INSERT INTO dentista (id, nome, cro, especialidade) VALUES
('d1000000-0000-0000-0000-000000000001', 'Dr. Carlos Mendes', 'CRO-SP-0001', 'Ortodontia'),
('d2000000-0000-0000-0000-000000000002', 'Dra. Fernanda Lima', 'CRO-SP-0002', 'Implantodontia'),
('d3000000-0000-0000-0000-000000000003', 'Dr. João Pedro', 'CRO-SP-0003', 'Clínica Geral'),
('d4000000-0000-0000-0000-000000000004', 'Dra. Ana Souza', 'CRO-SP-0004', 'Odontopediatria'),
('d5000000-0000-0000-0000-000000000005', 'Dr. Ricardo Gomes', 'CRO-SP-0005', 'Endodontia')
ON CONFLICT (id) DO NOTHING;

-- Usuários Pacientes
INSERT INTO usuario (id, tenant_id, email, senha_hash, nome, perfil) VALUES
('p1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'paciente1@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Mateus Silva', 'CLIENTE'),
('p2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'paciente2@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Julia Santos', 'CLIENTE'),
('p3000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'paciente3@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Roberto Alves', 'CLIENTE'),
('p4000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'paciente4@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Camila Ferreira', 'CLIENTE'),
('p5000000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'paciente5@mock.local', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Bruno Costa', 'CLIENTE')
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Tabela Paciente Específica
INSERT INTO paciente (id, tenant_id, usuario_id, nome, email, telefone) VALUES
('pac00000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'p1000000-0000-0000-0000-000000000001', 'Mateus Silva', 'paciente1@mock.local', '11999990001'),
('pac00000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'p2000000-0000-0000-0000-000000000002', 'Julia Santos', 'paciente2@mock.local', '11999990002'),
('pac00000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', 'p3000000-0000-0000-0000-000000000003', 'Roberto Alves', 'paciente3@mock.local', '11999990003'),
('pac00000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'p4000000-0000-0000-0000-000000000004', 'Camila Ferreira', 'paciente4@mock.local', '11999990004'),
('pac00000-0000-0000-0000-000000000005', '22222222-2222-2222-2222-222222222222', 'p5000000-0000-0000-0000-000000000005', 'Bruno Costa', 'paciente5@mock.local', '11999990005')
ON CONFLICT (tenant_id, email) DO NOTHING;

-- Configuração de Agendas para os dentistas
INSERT INTO agenda (id, tenant_id, dentista_usuario_id, regra_semana) VALUES
('a1000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'd1000000-0000-0000-0000-000000000001', '[{"fim": "18:00", "ativo": true, "inicio": "08:00", "diaSemana": "MONDAY"}, {"fim": "18:00", "ativo": true, "inicio": "08:00", "diaSemana": "WEDNESDAY"}]'),
('a2000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'd2000000-0000-0000-0000-000000000002', '[{"fim": "17:00", "ativo": true, "inicio": "09:00", "diaSemana": "TUESDAY"}, {"fim": "17:00", "ativo": true, "inicio": "09:00", "diaSemana": "THURSDAY"}]')
ON CONFLICT (tenant_id, dentista_usuario_id) DO NOTHING;

-- Agendamentos de Teste
INSERT INTO agendamento (id, tenant_id, agenda_id, paciente_id, dentista_usuario_id, inicio_at, fim_at, status) VALUES
-- D1 (Carlos Mendes)
('ag000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'pac00000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', now() + interval '1 day', now() + interval '1 day' + interval '30 minutes', 'CONFIRMADO'),
('ag000000-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'pac00000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', now() + interval '2 day', now() + interval '2 day' + interval '30 minutes', 'PENDENTE'),
('ag000000-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'pac00000-0000-0000-0000-000000000004', 'd1000000-0000-0000-0000-000000000001', now() - interval '1 day', now() - interval '1 day' + interval '30 minutes', 'CANCELADO'),
('ag000000-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'pac00000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', now() + interval '3 day', now() + interval '3 day' + interval '30 minutes', 'CONFIRMADO'),
('ag000000-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'pac00000-0000-0000-0000-000000000002', 'd1000000-0000-0000-0000-000000000001', now() + interval '4 day', now() + interval '4 day' + interval '30 minutes', 'CONFIRMADO'),

-- D2 (Fernanda Lima)
('ag000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000002', 'pac00000-0000-0000-0000-000000000001', 'd2000000-0000-0000-0000-000000000002', now() + interval '1 day', now() + interval '1 day' + interval '30 minutes', 'PENDENTE'),
('ag000000-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000002', 'pac00000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000002', now() + interval '5 day', now() + interval '5 day' + interval '30 minutes', 'CONFIRMADO'),
('ag000000-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'a2000000-0000-0000-0000-000000000002', 'pac00000-0000-0000-0000-000000000004', 'd2000000-0000-0000-0000-000000000002', now() - interval '2 day', now() - interval '2 day' + interval '30 minutes', 'CONCLUIDO'),

-- Placeholder IDs for the remaining up to 15
('ag000000-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'pac00000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', now() + interval '6 day', now() + interval '6 day' + interval '30 minutes', 'PENDENTE'),
('ag000000-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'a1000000-0000-0000-0000-000000000001', 'pac00000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001', now() + interval '7 day', now() + interval '7 day' + interval '30 minutes', 'CONFIRMADO')
ON CONFLICT (id) DO NOTHING;
