ALTER TABLE sessao_chat ADD CONSTRAINT uk_sessao_cliente_dentista UNIQUE (cliente_id, dentista_id);
