-- V17: Security Definer para Refresh Token
-- Permite que o RefreshTokenService busque os hashes ativos ignorando o RLS temporariamente,
-- apenas para encontrar o tenant_id correspondente ao token fornecido e inicializar o contexto.

CREATE OR REPLACE FUNCTION public.get_all_refresh_tokens_hashes()
RETURNS TABLE (
    id UUID,
    token_hash VARCHAR,
    tenant_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Retorna apenas tokens que ainda não expiraram e não foram revogados
    RETURN QUERY 
    SELECT r.id, r.token_hash, r.tenant_id 
    FROM public.refresh_token r 
    WHERE r.revoked_at IS NULL AND r.expires_at > now();
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_refresh_tokens_hashes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_refresh_tokens_hashes() TO clicksmile_app;
GRANT EXECUTE ON FUNCTION public.get_all_refresh_tokens_hashes() TO postgres;
