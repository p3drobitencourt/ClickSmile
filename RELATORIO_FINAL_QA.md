# CLICKSMILE — QA E2E PRODUÇÃO

## Ambiente

Frontend:
https://click-smile.vercel.app/

Backend:
https://clicksmile-backend.onrender.com

Commit testado:
4e54ddb

## Status Geral

🟡 Funciona com problema (Sistema bloqueado pelo Login)

## 1. Health
🟢 Funcionando
O endpoint `/health` acordou o Render e retornou 200 OK com sucesso após o cold start.

## 2. Frontend
🟢 Funcionando
A aplicação Angular foi compilada e servida pela Vercel sem problemas de JS fatal. O roteamento direto funciona perfeitamente (ex: `/register`, `/login`).

## 3. Cadastro
🟢 Funcionando
### Paciente
A interface validou corretamente o formulário e exigiu a vinculação com uma clínica. O request `POST /api/auth/register` obteve sucesso com dados persistidos.
### Dentista
A criação do dentista (tenant próprio) é realizada com sucesso no banco em transação atômica.

## 4. Login
🔴 Quebrado
Após o cadastro, qualquer tentativa de Login retorna **401 Unauthorized** com a mensagem "E-mail ou senha incorretos".
**Causa:** A function `get_auth_user_by_email` definida no Supabase esbarra no RLS porque a role de execução (`clicksmile_app`) não tem a permissão `BYPASSRLS`.

## 5. Refresh Token
🔴 Quebrado
Da mesma forma que o Login, ao dar um "F5" (refresh), o Angular tenta usar a rota silênciosa de `/refresh` e bate num muro 401 por RLS barrando a leitura da function de tokens. O interceptor, corretamente, reage deslogando o usuário.

## 6. Clínicas / Mapa
🟡 Funciona com problema (Não avança pela UI)
O endpoint público `/api/public/clinicas` está entregando as coordenadas (latitude e longitude), mas o mapa da UI não foi validado end-to-end pois a sessão cai antes de entrar no painel do paciente.

## 7. Chat
🟡 Não validado na UI (Depende de Sessão Logada)

## 8. Agendamento
🟡 Não validado na UI (Depende de Sessão Logada)

## 9. Gestão de Pacientes
🟡 Não validado na UI (Depende de Sessão Logada)

## 10. Multi-Tenant
🟢 Funcionando (Parcialmente testado no DB)
Os testes isolados via scripts PowerShell E2E comprovam que a arquitetura Multi-tenant (TenantContext) no Spring Boot garante persistência isolada e leitura de `/usuarios/me` com segurança. 

## 11. Responsividade
🟢 Funcionando
Testado nas proporções mobile (390x844). A navbar, forms de cadastro e views de auth estão se adaptando perfeitamente à tela em TailwindCSS.

## 12. Console / Network
- Warnings relacionados ao carregamento assíncrono e `InvalidKey` da API do Google Maps.
- Status `401` em solicitações XHR (`/login`, `/refresh`) que forçam o deslogamento imediato.

## 13. Problemas encontrados

### A. RLS bloqueando Functions "Security Definer"
- **severidade**: P0 (Crítico / Bloqueador)
- **reprodução**: Tentar logar com conta recém-cadastrada
- **URL**: `POST /api/auth/login` e `/api/auth/refresh`
- **usuário/perfil**: Qualquer Perfil
- **comportamento esperado**: Autenticar o usuário e setar HTTPOnly Cookie com token.
- **comportamento atual**: Erro HTTP 401 (Sem logs de falha bruta).
- **camada provável**: Banco de Dados (Supabase / RLS)
- **evidência**: Identificado através do relatório da infra que as roles do render não possuem `BYPASSRLS`.
- **arquivo provável responsável**: Migrations do Flyway (ex: V19, V20) que criaram a função. Elas precisam definir o dono (OWNER) da function como `postgres` e não como a role conectada pelo flyway, ou garantir que quem assina a função tenha privilégio total.

## 14. O que NÃO precisa ser corrigido
- A lógica de transação no JPA para inserir um novo Cadastro (Está atômica).
- A proteção contra spoofing de *tenantId* no código Frontend/Backend (Está isolando).
- O roteamento e componentes estáticos do Angular na Vercel (O Build de produção passa liso).

## 15. Recomendação

- **P0 — bloqueadores de produção**: Precisamos realizar uma correção de infraestrutura na role ou nas *functions* `get_auth_user_by_email` e `get_all_refresh_tokens_hashes` no PostgreSQL.
- **P2 — UX/UI**: Quando estabilizado, precisamos aplicar uma chave de desenvolvimento limpa do Maps e cuidar da página `root` (`/`).
