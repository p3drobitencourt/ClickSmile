DROP TABLE IF EXISTS mensagem CASCADE;

CREATE TABLE mensagem (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    room_id VARCHAR(255) NOT NULL,
    sender_id UUID NOT NULL REFERENCES usuario (id),
    sender_name VARCHAR(255),
    recipient_id UUID NOT NULL REFERENCES usuario (id),
    content VARCHAR(1000) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE INDEX idx_mensagem_room_id ON mensagem (room_id);
CREATE INDEX idx_mensagem_sent_at ON mensagem (sent_at);

ALTER TABLE mensagem ENABLE ROW LEVEL SECURITY;

CREATE POLICY mensagem_tenant_isolation ON mensagem
    USING (
        sender_id IN (
            SELECT id FROM usuario WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        )
        OR recipient_id IN (
            SELECT id FROM usuario WHERE tenant_id = NULLIF(current_setting('app.tenant_id', true), '')::uuid
        )
    );
