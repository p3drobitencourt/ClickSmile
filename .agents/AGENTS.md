# REGRA ARQUITETURAL PERMANENTE DE BANCO DO CLICKSMILE

A partir deste momento, considere estas regras como obrigatórias para todo o projeto ClickSmile.

## OBJETIVO
Garantir que o PostgreSQL do Supabase seja a única fonte de verdade estrutural do banco de produção e que o Render execute somente a aplicação, sem manter ou criar um banco/schema paralelo.

## REGRAS OBRIGATÓRIAS

### 1. SUPABASE COMO FONTE DE VERDADE
O PostgreSQL hospedado no Supabase é o banco oficial de produção.
O Render NÃO possui banco de dados próprio do ClickSmile.
O Render apenas executa o Spring Boot e conecta-se ao PostgreSQL do Supabase.
Nunca criar uma segunda estrutura de banco para produção dentro do Render.

### 2. FLYWAY COMO ÚNICO MECANISMO DE EVOLUÇÃO DO SCHEMA
Toda alteração estrutural deve ser feita através de migration Flyway versionada.
Exemplos:
- CREATE TABLE
- ALTER TABLE
- DROP TABLE
- ADD COLUMN
- ALTER COLUMN
- CREATE INDEX
- CREATE CONSTRAINT
- CREATE POLICY
- ENABLE/DISABLE RLS
- CREATE ROLE, quando aplicável à infraestrutura

devem ser tratados explicitamente e de forma controlada.
Nunca criar estrutura de banco através de lógica Java de runtime.

### 3. HIBERNATE/JPA NÃO PODE GERENCIAR O SCHEMA DE PRODUÇÃO
Produção deve permanecer com:
`spring.jpa.hibernate.ddl-auto=none`
Hibernate/JPA deve funcionar exclusivamente como ORM.

É proibido utilizar em produção:
- `create`
- `create-drop`
- `update`
- `validate` como mecanismo de alteração automática do schema

Nenhuma entidade Java deve ser usada como mecanismo automático de criação ou alteração do banco.

### 4. SEPARAÇÃO ENTRE RUNTIME E MIGRATION
**Runtime:**
SPRING_DATASOURCE_URL
SPRING_DATASOURCE_USERNAME
SPRING_DATASOURCE_PASSWORD
deve utilizar exclusivamente a role restrita: `clicksmile_app`
Essa role NÃO pode possuir:
- SUPERUSER
- BYPASSRLS
- privilégios administrativos desnecessários

**Flyway:**
SPRING_FLYWAY_URL
SPRING_FLYWAY_USER
SPRING_FLYWAY_PASSWORD
deve utilizar uma conexão administrativa separada, quando necessário para DDL.
Nunca utilizar a role runtime clicksmile_app como substituta de uma role administrativa.

### 5. NÃO HARDCODeAR CREDENCIAIS
Nenhuma senha, token, URL privada, chave ou credencial deve ser colocada diretamente no código-fonte.
Tudo deve ser obtido por variáveis de ambiente/configuração segura.
Nunca imprimir credenciais nos logs.

### 6. SCHEMA
Não criar schemas paralelos sem decisão arquitetural explícita.
O schema padrão de produção atualmente é: `public`
Não adicionar:
`@Table(schema = "...")`
ou:
`SET SCHEMA`
sem justificativa arquitetural explícita e revisão.

### 7. MULTI-TENANT
Toda nova entidade que contenha dados pertencentes a uma clínica deve obrigatoriamente ser analisada para:
- tenant_id
- TenantAware
- TenantEntityListener
- RLS
- policy USING
- policy WITH CHECK
- TenantContext
- Hibernate Filter
- testes cross-tenant

Não permitir que uma nova tabela multi-tenant seja criada sem proteção RLS.

### 8. TODA NOVA MIGRATION DEVE SER ANALISADA
Antes de considerar uma migration concluída, verificar:
- ordem da migration
- compatibilidade com PostgreSQL/Supabase
- foreign keys
- índices
- constraints
- tenant_id quando aplicável
- RLS quando aplicável
- policies
- grants
- impacto no Flyway
- compatibilidade com entidades JPA
- compatibilidade com produção

### 9. QUERIES NATIVAS
Qualquer uso futuro de:
- JdbcTemplate
- EntityManager native query
- @Query(nativeQuery = true)
- JDBC direto

deve ser auditado para garantir que não introduza bypass do isolamento multi-tenant.
Não assumir que `@Filter` JPA protege automaticamente uma query SQL nativa.

### 10. NÃO ALTERAR INFRAESTRUTURA SEM AUTORIZAÇÃO
Antes de executar:
- CREATE ROLE
- ALTER ROLE
- GRANT
- REVOKE
- ALTER TABLE ... ENABLE RLS
- DROP
- TRUNCATE
- ALTER DATABASE
- alterações em produção

apresentar primeiro:
- impacto
- risco
- rollback
- ambiente afetado
- credencial utilizada
- consequência para Render
- consequência para Supabase
e aguardar autorização explícita quando a operação for destrutiva ou de produção.

### 11. TESTES
Sempre distinguir:
- TESTE UNITÁRIO
- TESTE COM H2
- TESTE DE INTEGRAÇÃO
- TESTE CONTRA SUPABASE
- TESTE DE PRODUÇÃO

Nunca considerar um teste H2 como prova de funcionamento de RLS PostgreSQL.
Testes de RLS devem ser executados contra PostgreSQL.

### 12. CHECKLIST OBRIGATÓRIO PARA NOVAS FUNCIONALIDADES
Antes de concluir qualquer nova etapa que altere persistência:
- [ ] Existe migration Flyway?
- [ ] A migration é compatível com PostgreSQL/Supabase?
- [ ] Hibernate ddl-auto continua none em produção?
- [ ] A entidade JPA corresponde ao schema real?
- [ ] Existe tenant_id quando necessário?
- [ ] RLS foi analisado?
- [ ] Policy foi analisada?
- [ ] clicksmile_app continua sem BYPASSRLS?
- [ ] Existe risco de query nativa?
- [ ] Existe risco de N+1?
- [ ] Foram adicionados testes?
- [ ] Foi testado contra PostgreSQL quando necessário?
- [ ] Render continua apontando para Supabase?
- [ ] Não foi criado banco/schema paralelo?
- [ ] Nenhuma credencial foi adicionada ao código?

## REGRA FINAL
O fluxo oficial do ClickSmile é:
SUPABASE POSTGRESQL -> FLYWAY -> SCHEMA -> JPA/HIBERNATE -> SPRING BOOT -> RENDER

O PostgreSQL/Supabase é a fonte de verdade.
Flyway controla evolução estrutural.
Hibernate/JPA não controla o schema de produção.
Render executa a aplicação.
Essa regra deve ser preservada em todas as etapas futuras do projeto.
