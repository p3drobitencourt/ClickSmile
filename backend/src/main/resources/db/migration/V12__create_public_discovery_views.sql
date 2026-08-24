-- V12__create_public_discovery_views.sql
-- Views Públicas com Security Definer para permitir busca deslogada (Visitantes)
-- Sem comprometer o isolamento RLS Multi-tenant das aplicações normais.
-- A role migration ('postgres' / 'supabase_admin') é o owner destas views,
-- portanto a execução dessas queries bypassa RLS *apenas* para os campos expostos publicamente.

CREATE VIEW public.vw_dentista_publico AS
SELECT 
    d.id AS dentista_id, 
    u.nome, 
    u.email, 
    d.cro, 
    d.especialidade, 
    tc.latitude, 
    tc.longitude,
    u.tenant_id
FROM public.dentista d
JOIN public.usuario u ON d.id = u.id
JOIN public.tenant_clinica tc ON u.tenant_id = tc.id
WHERE u.perfil = 'DENTISTA' 
  AND tc.latitude IS NOT NULL 
  AND tc.longitude IS NOT NULL;

CREATE VIEW public.vw_agenda_publica AS
SELECT 
    a.id, 
    a.dentista_usuario_id, 
    a.tenant_id, 
    a.timezone, 
    a.slot_duration_min, 
    a.hora_inicio_padrao,
    a.hora_fim_padrao,
    a.regra_semana
FROM public.agenda a
WHERE a.ativo = true;

CREATE VIEW public.vw_agendamento_publico AS
SELECT 
    ag.id, 
    ag.dentista_id, 
    ag.tenant_id, 
    ag.data_hora, 
    ag.status
FROM public.agendamento ag
WHERE ag.status != 'CANCELADO' AND ag.status != 'REJEITADO';

-- Garantir que o Spring Boot runtime consiga ler estas views públicas
GRANT SELECT ON public.vw_dentista_publico TO clicksmile_app;
GRANT SELECT ON public.vw_agenda_publica TO clicksmile_app;
GRANT SELECT ON public.vw_agendamento_publico TO clicksmile_app;
