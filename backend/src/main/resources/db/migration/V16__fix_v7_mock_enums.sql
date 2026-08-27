-- Migration V16: Correcao dos dados mockados da V7 para alinhar com o Enum Perfil do Java
-- O Enum Perfil no backend possui: PACIENTE, DENTISTA, RECEPCAO, TENANT_ADMIN
-- A tabela no banco de producao possui registros antigos (ADMIN, CLIENTE) gerados pela V7.

UPDATE usuario
SET perfil = 'TENANT_ADMIN'
WHERE perfil = 'ADMIN';

UPDATE usuario
SET perfil = 'PACIENTE'
WHERE perfil = 'CLIENTE';
