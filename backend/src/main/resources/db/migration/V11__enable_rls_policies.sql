-- Migration Flyway (Proposta)
-- Habilita RLS de forma idempotente e segura

-- 1. Paciente
ALTER TABLE paciente ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS paciente_tenant_isolation ON paciente;
CREATE POLICY paciente_tenant_isolation ON paciente TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);

-- 2. Agenda
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agenda_tenant_isolation ON agenda;
CREATE POLICY agenda_tenant_isolation ON agenda TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);

-- 3. Agendamento
ALTER TABLE agendamento ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS agendamento_tenant_isolation ON agendamento;
CREATE POLICY agendamento_tenant_isolation ON agendamento TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);

-- 4. SessaoChat
ALTER TABLE sessao_chat ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- Opcional: Adicionar FK
-- ALTER TABLE sessao_chat ADD CONSTRAINT fk_sessao_chat_tenant FOREIGN KEY (tenant_id) REFERENCES tenant_clinica(id);
ALTER TABLE sessao_chat ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS sessao_chat_tenant_isolation ON sessao_chat;
CREATE POLICY sessao_chat_tenant_isolation ON sessao_chat TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);

-- 5. Mensagem
ALTER TABLE mensagem ADD COLUMN IF NOT EXISTS tenant_id UUID;
-- Opcional: Adicionar FK
-- ALTER TABLE mensagem ADD CONSTRAINT fk_mensagem_tenant FOREIGN KEY (tenant_id) REFERENCES tenant_clinica(id);
ALTER TABLE mensagem ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS mensagem_tenant_isolation ON mensagem;
CREATE POLICY mensagem_tenant_isolation ON mensagem TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);

-- 6. Usuario
ALTER TABLE usuario ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS usuario_tenant_isolation ON usuario;
CREATE POLICY usuario_tenant_isolation ON usuario TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);

-- 7. RefreshToken
ALTER TABLE refresh_token ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS refresh_token_tenant_isolation ON refresh_token;
CREATE POLICY refresh_token_tenant_isolation ON refresh_token TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);

-- NOTA: A tabela `conversa_chat` já possuía policy, porém apontada para "public". 
-- Vamos atualizar para `clicksmile_app` mantendo o padrão restrito.
DROP POLICY IF EXISTS conversa_tenant_isolation ON conversa_chat;
CREATE POLICY conversa_tenant_isolation ON conversa_chat TO clicksmile_app
    USING (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid)
    WITH CHECK (tenant_id = (NULLIF(current_setting('app.tenant_id', true), ''))::uuid);
