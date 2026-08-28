-- V19: Correção do tipo de retorno da função Security Definer
-- A tabela refresh_token usa CHAR(64) para token_hash, mas a V17 definiu o retorno como VARCHAR.
-- No PostgreSQL, isso causa erro de "structure of query does not match function result type".

DROP FUNCTION IF EXISTS public.get_all_refresh_tokens_hashes();

CREATE OR REPLACE FUNCTION public.get_all_refresh_tokens_hashes()
RETURNS TABLE (
    id UUID,
    token_hash CHAR(64),
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
