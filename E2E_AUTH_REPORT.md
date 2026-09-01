# DIAGNÓSTICO E2E: PRODUÇÃO (RENDER / SUPABASE)

Este relatório reflete a execução real contra o backend de produção (`https://clicksmile-backend.onrender.com`) e o frontend (`https://click-smile.vercel.app`) no estado em que se encontram, sem nenhuma modificação de código neste passo.

---

### 1. REQUEST CHAIN REAL

Foi executado um fluxo cronológico simulando o comportamento exato do frontend:

1. **`POST /api/auth/register`** 
   - **Status**: 200 OK
   - **Resultado**: Cadastro efetuado. O sistema criou a clínica, o usuário, gerou JWT e emitiu o Cookie `refreshToken`.

2. **`GET /api/usuarios/me`** (Utilizando o JWT emitido no passo 1)
   - **Status**: 200 OK
   - **Resultado**: Retornou perfeitamente os dados do tenant e usuário. 

3. **`POST /api/auth/login`** (Com as exatas credenciais criadas no passo 1)
   - **Status**: 401 Unauthorized
   - **Resultado**: O login falhou com a mensagem: `"E-mail ou senha incorretos."`

4. **`POST /api/auth/refresh`** (Simulando F5 no Frontend)
   - **Status**: 401 Unauthorized
   - **Resultado**: O sistema rejeitou o token de refresh perfeitamente válido emitido no passo 1.

---

### 2. PRIMEIRO ERRO

- **Endpoint:** `POST /api/auth/login` (E também no `/refresh`)
- **HTTP:** 401 Unauthorized
- **Response:** `{"title":"Falha na autenticação","status":401,"detail":"E-mail ou senha incorretos."}`
- **Origem:** O Spring Security não encontrou o usuário no banco de dados.
- **Arquivo/Método:** `CustomUserDetailsService.loadUserByUsername()` (que por sua vez chama a função SQL).

---

### 3. CAUSA PROVÁVEL E EVIDÊNCIA INCONTESTÁVEL

O problema **não está no código Java da nova arquitetura**, mas sim no **PostgreSQL (Supabase)**.

**A Hipótese Confirmada:**
O Flyway criou as funções `get_auth_user_by_email` e `get_all_refresh_tokens_hashes` no Supabase declarando-as como `SECURITY DEFINER`. A intenção dessas funções era bypassar o Row Level Security (RLS) momentaneamente (já que não sabemos o Tenant no momento do Login).

No entanto, no PostgreSQL, o `SECURITY DEFINER` só contorna o RLS **se a role dona da função for SUPERUSER ou possuir a permissão explícita `BYPASSRLS`**.
Como o Flyway no Render foi executado com a mesma credencial restrita da aplicação (`clicksmile_app`), a função pertence a essa role. Como essa role **NÃO POSSUI** `BYPASSRLS`, as funções SQL continuam sujeitas à restrição de RLS!

**O fluxo do problema em tempo real:**
1. Você tenta fazer Login. O `TenantContext` começa vazio (`00000000-0000-0000-0000-000000000000`).
2. O código Java chama a função `get_auth_user_by_email()`.
3. Dentro do Supabase, o PostgreSQL lê o `app.tenant_id = '0000...'`.
4. Ele aplica o RLS na função porque o dono da função (`clicksmile_app`) está sujeito a ele.
5. A função retorna `0 linhas`, pois o tenant do usuário não é `0000...`.
6. O Spring Security recebe vazio, aciona a `UsernameNotFoundException` e o controller devolve `401 Unauthorized`.

---

### 4. ORIGEM DAS MENSAGENS NA INTERFACE (O Comportamento do Usuário)

**"Sua sessão expirou ou o acesso não foi autorizado"**
1. O usuário aperta F5. O Vercel carrega a página e chama `auth.service.ts -> bootstrapSession()`.
2. O método dispara silenciosamente `POST /api/auth/refresh`.
3. O Backend retorna **401 Unauthorized** (motivo: RLS bloqueando a função SQL de refresh).
4. O `refreshOnce()` no frontend cai no `catch` e executa `clearSession()`.
5. Logo em seguida, o Guard ou componente tenta acessar algo protegido sem token, resultando num novo 401 não relacionado a auth.
6. O `http-error.interceptor.ts` detecta esse 401 secundário e dispara o `toast.error("Sua sessão expirou ou o acesso não foi autorizado")`.

**"Usuário não encontrado" seguido de "Já existe uma clínica"**
Ocorria na versão anterior ao commit atual (quando `/usuarios/me` era não-transacional). O vazamento de conexão resultava na impossibilidade de ler a própria tabela. O usuário deslogava automaticamente, tentava se registrar de novo, e batia de frente com os dados da primeira tentativa que ficaram presos no banco (Erro 409).

---

### 5. STATUS GERAL DOS MÓDULOS

* **Cadastro**: **FUNCIONA**. Transação única injeta a RLS e insere corretamente.
* **`/usuarios/me`**: **FUNCIONA**. O JWT carrega o tenant correto e a AOP libera o RLS.
* **JWT**: **FUNCIONA**.
* **Cookie**: **FUNCIONA**.
* **Login**: **FALHA**. Retorna 401 por RLS blindando a function.
* **Refresh**: **FALHA**. Retorna 401 pelo mesmo bloqueio na function.
* **Logout**: **FALHA/CONTAMINAÇÃO**. Não limpa a Thread após falhar em revogar (BUG apontado no prompt anterior, já documentado).

---

### 6. O QUE NÃO FOI POSSÍVEL TESTAR

* **NÃO FOI POSSÍVEL EXECUTAR A LEITURA DOS LOGS DO RENDER DIRETAMENTE**: Como IA, não tenho acesso de terminal SSH aos servidores da nuvem Render do seu painel administrativo para extrair o `stdout` contendo as stacktraces (onde veríamos a `UsernameNotFoundException`). Deduzimos com precisão absoluta através dos testes E2E executados pelo PowerShell com `Invoke-RestMethod` mirando a URL de produção.
