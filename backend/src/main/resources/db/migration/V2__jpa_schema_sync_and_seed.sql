ALTER TABLE usuario ADD COLUMN IF NOT EXISTS perfil VARCHAR(50);
UPDATE usuario SET perfil = 'CLIENTE' WHERE perfil IS NULL;
ALTER TABLE usuario ALTER COLUMN perfil SET NOT NULL;

CREATE TABLE IF NOT EXISTS cliente (
    id UUID PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
    nome VARCHAR(160) NOT NULL,
    telefone VARCHAR(20) NOT NULL
);

CREATE TABLE IF NOT EXISTS dentista (
    id UUID PRIMARY KEY REFERENCES usuario(id) ON DELETE CASCADE,
    nome VARCHAR(160) NOT NULL,
    cro VARCHAR(20) NOT NULL UNIQUE,
    especialidade VARCHAR(255) NOT NULL
);

-- Seed data
INSERT INTO tenant_clinica (id, cnpj, razao_social, nome_fantasia)
VALUES ('00000000-0000-0000-0000-000000000001', '00000000000000', 'Clinica Teste', 'ClickSmile Demo')
ON CONFLICT (cnpj) DO NOTHING;

INSERT INTO usuario (id, tenant_id, email, senha_hash, nome, perfil)
VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'dentista@teste.com', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Dr. Demo', 'DENTISTA')
ON CONFLICT (tenant_id, email) DO NOTHING;

INSERT INTO dentista (id, nome, cro, especialidade)
VALUES ('00000000-0000-0000-0000-000000000002', 'Dr. Demo', 'CRO-12345', 'Ortodontia')
ON CONFLICT (id) DO NOTHING;

INSERT INTO usuario (id, tenant_id, email, senha_hash, nome, perfil)
VALUES ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'cliente@teste.com', '$2a$10$wE7/L1p2j.zR9Lg9YvG/dOiS8.e4U.0r4aZ/2x1uO1b/Z2y5.23/q', 'Cliente Demo', 'CLIENTE')
ON CONFLICT (tenant_id, email) DO NOTHING;

INSERT INTO cliente (id, nome, telefone)
VALUES ('00000000-0000-0000-0000-000000000003', 'Cliente Demo', '11999999999')
ON CONFLICT (id) DO NOTHING;
