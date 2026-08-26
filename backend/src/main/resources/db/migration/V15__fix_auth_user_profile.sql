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
    SELECT
        u.id,
        u.email,
        u.senha_hash,
        u.tenant_id,
        u.perfil::VARCHAR,
        u.status
    FROM public.usuario u
    WHERE u.email = p_email
      AND u.status = 'ACTIVE';
END;
$$;

REVOKE ALL ON FUNCTION public.get_auth_user_by_email(CITEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(CITEXT) TO clicksmile_app;
GRANT EXECUTE ON FUNCTION public.get_auth_user_by_email(CITEXT) TO postgres;
