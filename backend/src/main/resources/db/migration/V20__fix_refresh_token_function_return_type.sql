-- V20: Corrige o retorno da função de refresh token para VARCHAR.
-- A coluna refresh_token.token_hash é CHAR(64), mas o Hibernate espera VARCHAR.
-- O cast para VARCHAR também remove o padding de espaços do CHAR(64), preservando o hash bcrypt real.

DROP FUNCTION IF EXISTS public.get_all_refresh_tokens_hashes();

CREATE FUNCTION public.get_all_refresh_tokens_hashes()
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
    WHERE r.revoked_at IS NULL
      AND r.expires_at > now();
END;
$$;

REVOKE ALL ON FUNCTION public.get_all_refresh_tokens_hashes() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_all_refresh_tokens_hashes() TO clicksmile_app;
GRANT EXECUTE ON FUNCTION public.get_all_refresh_tokens_hashes() TO postgres;
