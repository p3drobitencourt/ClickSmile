-- V18: Remover os dados de mock introduzidos na V7
-- Estes usuários possuem hashes BCrypt inválidos/desalinhados e senhas menores que 8 caracteres
-- Isso estava causando falsos negativos de login e dificultando o QA E2E

-- Remover usuários e suas associações em cascata
DELETE FROM usuario WHERE id IN (
    'a0000000-0000-0000-0000-000000000001',
    'd1000000-0000-0000-0000-000000000001',
    'd2000000-0000-0000-0000-000000000002',
    'd3000000-0000-0000-0000-000000000003',
    'b1000000-0000-0000-0000-000000000001',
    'b2000000-0000-0000-0000-000000000002',
    'b3000000-0000-0000-0000-000000000003'
);

-- Remover os Tenants Mockados (só podem ser apagados se não existirem dados amarrados,
-- o que deve ser o caso pois deletamos os usuários acima, mas não faremos CASCADE explícito para segurança)
DELETE FROM tenant_clinica WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);
