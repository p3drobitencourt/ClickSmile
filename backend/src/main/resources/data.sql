-- Create a test tenant if it doesn't exist
INSERT INTO tenant_clinica (id, cnpj, razao_social, nome_fantasia)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000000000', 'Clinica Teste', 'ClickSmile Demo')
ON CONFLICT (cnpj) DO NOTHING;

-- The actual user inserts will be handled by the application logic or we can use generic ones,
-- but since UUIDs and passwords require hashing, doing it in raw SQL is tricky for Bcrypt.
-- I'll create a basic mock user for testing if needed.
-- Note: 'senha' is '123456' hashed with bcrypt: $2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q
INSERT INTO usuario (id, tenant_id, email, senha, nome, perfil)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'dentista@teste.com', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Dr. Demo', 'DENTISTA')
ON CONFLICT (email) DO NOTHING;

INSERT INTO dentista (id, cro, especialidade)
VALUES ('00000000-0000-0000-0000-000000000002', 'CRO-12345', 'Ortodontia')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuario (id, tenant_id, email, senha, nome, perfil)
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'cliente@teste.com', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Cliente Demo', 'CLIENTE')
ON CONFLICT (email) DO NOTHING;

INSERT INTO cliente (id, nome, telefone)
VALUES ('00000000-0000-0000-0000-000000000003', 'Cliente Demo', '11999999999')
ON CONFLICT (id) DO NOTHING;
