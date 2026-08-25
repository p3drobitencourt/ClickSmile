-- V13__fix_public_discovery_views.sql
-- Corrige a view de agendamento publico, substituindo colunas incorretas que falharam na V12.

CREATE OR REPLACE VIEW public.vw_agendamento_publico AS
SELECT 
    ag.id, 
    ag.dentista_usuario_id, 
    ag.tenant_id, 
    ag.inicio_at, 
    ag.status
FROM public.agendamento ag
WHERE ag.status != 'CANCELADO' AND ag.status != 'REJEITADO';

GRANT SELECT ON public.vw_agendamento_publico TO clicksmile_app;
