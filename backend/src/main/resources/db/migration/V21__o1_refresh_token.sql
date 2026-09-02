-- V21: Função para buscar o hash do refresh token de forma isolada por ID (O(1)).
-- Isso evita o carregamento massivo (O(N)) de todos os hashes do sistema a cada refresh.

CREATE FUNCTION public.get_refresh_token_hash_by_id(p_id UUID)
RETURNS TABLE (
    id UUID,
    token_hash VARCHAR(64),
    tenant_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.token_hash::VARCHAR(64),
        r.tenant_id
    FROM public.refresh_token r
    WHERE r.id = p_id
      AND r.revoked_at IS NULL
      AND r.expires_at > now();
END;
$$;

REVOKE ALL ON FUNCTION public.get_refresh_token_hash_by_id(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_refresh_token_hash_by_id(UUID) TO clicksmile_app;
GRANT EXECUTE ON FUNCTION public.get_refresh_token_hash_by_id(UUID) TO postgres;
