CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE tenant_clinica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cnpj VARCHAR(14) NOT NULL UNIQUE,
    razao_social VARCHAR(200) NOT NULL,
    nome_fantasia VARCHAR(200) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DELETED')),
    timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE role (
    id SMALLSERIAL PRIMARY KEY,
    codigo VARCHAR(50) NOT NULL UNIQUE,
    descricao VARCHAR(120) NOT NULL
);

INSERT INTO role (codigo, descricao) VALUES
    ('TENANT_ADMIN', 'Administrador da clinica'),
    ('DENTISTA', 'Profissional de saude'),
    ('RECEPCAO', 'Operacao de agenda'),
    ('PACIENTE', 'Paciente final');

CREATE TABLE usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_clinica (id),
    email CITEXT NOT NULL,
    senha_hash VARCHAR(255) NOT NULL,
    nome VARCHAR(160) NOT NULL,
    telefone VARCHAR(20),
    documento VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'INACTIVE')),
    mfa_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    email_verificado BOOLEAN NOT NULL DEFAULT FALSE,
    ultimo_login_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uk_usuario_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_usuario_tenant ON usuario (tenant_id);

CREATE TABLE usuario_role (
    usuario_id UUID NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    role_id SMALLINT NOT NULL REFERENCES role (id),
    PRIMARY KEY (usuario_id, role_id)
);

CREATE TABLE paciente (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_clinica (id),
    usuario_id UUID UNIQUE REFERENCES usuario (id) ON DELETE SET NULL,
    nome VARCHAR(160) NOT NULL,
    email CITEXT,
    telefone VARCHAR(20),
    documento VARCHAR(20),
    data_nascimento DATE,
    observacao_criptografada BYTEA,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'BLOCKED', 'INACTIVE')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uk_paciente_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_paciente_tenant ON paciente (tenant_id);

CREATE TABLE agenda (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_clinica (id),
    dentista_usuario_id UUID NOT NULL REFERENCES usuario (id),
    timezone VARCHAR(64) NOT NULL DEFAULT 'America/Sao_Paulo',
    slot_duration_min INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_min BETWEEN 5 AND 240),
    hora_inicio_padrao TIME NOT NULL DEFAULT '08:00:00',
    hora_fim_padrao TIME NOT NULL DEFAULT '18:00:00',
    regra_semana JSONB NOT NULL DEFAULT '{}'::jsonb,
    ativo BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CONSTRAINT uk_agenda_tenant_dentista UNIQUE (tenant_id, dentista_usuario_id)
);

CREATE INDEX idx_agenda_tenant ON agenda (tenant_id);

CREATE TABLE agendamento (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_clinica (id),
    agenda_id UUID NOT NULL REFERENCES agenda (id),
    paciente_id UUID NOT NULL REFERENCES paciente (id),
    dentista_usuario_id UUID NOT NULL REFERENCES usuario (id),
    inicio_at TIMESTAMPTZ NOT NULL,
    fim_at TIMESTAMPTZ NOT NULL,
    periodo TSTZRANGE GENERATED ALWAYS AS (tstzrange(inicio_at, fim_at, '[)')) STORED,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDENTE' CHECK (status IN ('PENDENTE', 'CONFIRMADO', 'CANCELADO', 'CONCLUIDO', 'NAO_COMPARECEU')),
    origem VARCHAR(20) NOT NULL DEFAULT 'WEB' CHECK (origem IN ('WEB', 'ADMIN', 'CHAT', 'API')),
    assunto VARCHAR(160),
    observacao_criptografada BYTEA,
    cancelado_motivo VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ,
    CHECK (inicio_at < fim_at)
);

CREATE INDEX idx_agendamento_tenant_inicio ON agendamento (tenant_id, inicio_at);
CREATE INDEX idx_agendamento_tenant_paciente ON agendamento (tenant_id, paciente_id);

ALTER TABLE agendamento
    ADD CONSTRAINT ex_agendamento_sem_sobreposicao
    EXCLUDE USING gist (
        tenant_id WITH =,
        dentista_usuario_id WITH =,
        periodo WITH &&
    )
    WHERE (deleted_at IS NULL AND status IN ('PENDENTE', 'CONFIRMADO'));

CREATE TABLE conversa_chat (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_clinica (id),
    agendamento_id UUID REFERENCES agendamento (id) ON DELETE SET NULL,
    paciente_id UUID NOT NULL REFERENCES paciente (id),
    dentista_usuario_id UUID NOT NULL REFERENCES usuario (id),
    assunto VARCHAR(160),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'ARCHIVED')),
    last_message_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_conversa_tenant ON conversa_chat (tenant_id);

CREATE TABLE mensagem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_clinica (id),
    conversa_id UUID NOT NULL REFERENCES conversa_chat (id) ON DELETE CASCADE,
    remetente_usuario_id UUID NOT NULL REFERENCES usuario (id),
    tipo VARCHAR(20) NOT NULL DEFAULT 'TEXT' CHECK (tipo IN ('TEXT', 'SYSTEM', 'FILE', 'IMAGE')),
    conteudo_ciphertext BYTEA NOT NULL,
    conteudo_nonce BYTEA NOT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    entregue_em TIMESTAMPTZ,
    lido_em TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_mensagem_tenant_conversa ON mensagem (tenant_id, conversa_id, created_at);

CREATE TABLE refresh_token (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenant_clinica (id),
    usuario_id UUID NOT NULL REFERENCES usuario (id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    replaced_by_token_id UUID,
    device_fingerprint VARCHAR(128),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE refresh_token
    ADD CONSTRAINT fk_refresh_token_replaced_by
    FOREIGN KEY (replaced_by_token_id) REFERENCES refresh_token (id);

CREATE INDEX idx_refresh_token_tenant_usuario ON refresh_token (tenant_id, usuario_id);

ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE paciente ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamento ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversa_chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagem ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_token ENABLE ROW LEVEL SECURITY;

CREATE POLICY usuario_tenant_isolation ON usuario
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY paciente_tenant_isolation ON paciente
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY agenda_tenant_isolation ON agenda
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY agendamento_tenant_isolation ON agendamento
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY conversa_tenant_isolation ON conversa_chat
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY mensagem_tenant_isolation ON mensagem
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);

CREATE POLICY refresh_token_tenant_isolation ON refresh_token
    USING (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid)
    WITH CHECK (tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid);