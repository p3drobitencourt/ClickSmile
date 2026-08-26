-- Função SECURITY DEFINER para recuperar dados básicos de autenticação ignorando o RLS.
-- Essa função garante que o login possa ocorrer antes que o tenant_id seja definido no contexto.

CREATE OR REPLACE FUNCTION public.get_auth_user_by_email(p_email CITEXT)
RETURNS TABLE (
    id UUID,
    email CITEXT,
    senha_hash VARCHAR,
    tenant_id UUID,
    perfil VARCHAR,
    status VARCHAR
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.email, u.senha_hash, u.tenant_id,
           (SELECT r.codigo FROM usuario_role ur JOIN role r ON ur.role_id = r.id WHERE ur.usuario_id = u.id LIMIT 1)::VARCHAR,
           u.status
    FROM public.usuario u
    WHERE u.email = p_email AND u.status = 'ACTIVE';
END;
$$;

-- Revogar execução pública
REVOKE ALL ON FUNCTION public.get_auth_user_by_email(CITEXT) FROM PUBLIC;

-- Permitir execução apenas pelo usuário da aplicação (clicksmile_app e postgres)
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(CITEXT) TO clicksmile_app;
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(CITEXT) TO postgres;
