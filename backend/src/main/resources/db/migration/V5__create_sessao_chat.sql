CREATE TABLE sessao_chat (
    id UUID PRIMARY KEY,
    cliente_id UUID NOT NULL,
    dentista_id UUID NOT NULL,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_sessao_chat_participantes ON sessao_chat (cliente_id, dentista_id);
