# Plano de ação — reconstruir a API sobre o esquema v2

## Contexto

O banco foi migrado para o modelo v2 (33 tabelas, migrations `001`–`003` aplicadas) e
`src/modules/` foi esvaziada por completo: não existe mais nenhum controller, use-case,
repositório, validator, factory ou rota. Também saíram o `src/config/authz.ts` e a linha
`app.use(authz.injectActor)` do [app.ts](src/main/app.ts), porque o `ActorRepository`
consultava tabelas do v1 que não existem mais.

O que sobreviveu intacto é toda a infraestrutura genérica em `src/shared/` — adapters,
protocols, presenters, errors, middlewares, storage, metrics, o provider do Postgres e o
migrator. É sobre ela que a reconstrução acontece.

**Resultado pretendido:** uma API funcional com login, autorização por perfil e escopo de
turma, e os CRUDs que sustentam a demonstração do TCC.

## Decisões já tomadas

| Decisão       | Escolha                                                              |
| ------------- | -------------------------------------------------------------------- |
| Escopo        | MVP do TCC — fora: notificação, visão computacional, api_token       |
| Transporte    | Cookie httpOnly para sessão + `Authorization: Bearer` para API_TOKEN |
| Hash de senha | `@node-rs/argon2` (binários pré-compilados, sem node-gyp)            |
| Dados padrão  | Catálogo de permissões derivado do modelo, como migration numerada   |

## Por que autorização antes dos CRUDs

Não é preferência de estilo — é o formato deste código:

- **O escopo mora dentro do SQL.** O repositório de postagens que existia carregava a CTE
  `turma_visivel` embutida em toda consulta. No v2 o escopo tem três origens
  (`RESPONSAVEL_ALUNO→MATRICULA`, `PROFESSOR_TURMA`, `ACESSO_TURMA`). Uma listagem escrita
  sem isso não é "uma query faltando middleware" — é outra query.
- **Toda escrita grava autoria** (`postagem.autor_id`, `consentimento.registrado_por`,
  `acesso_turma.concedido_por`), que sai do ator.
- **A interface `Actor` precisa mudar** antes de qualquer controller: hoje tem
  `handle: string`, e o v2 não tem `handle`.
- **`canRequest(Feature.X)` é o primeiro middleware de toda rota** — o catálogo precisa
  estar decidido antes do primeiro arquivo de rota.
- **Sem login nada é testável**: com o `injectActor` global, tudo responde 401.

---

## Fase 0 — Fundação de autorização

Nada aqui expõe endpoint; é o alicerce de todo o resto.

**0.1 — Redefinir o catálogo de capability.** Reescrever
[src/config/features.ts](src/config/features.ts) no formato do v2: `PERMISSAO.codigo` é
`ACAO:RECURSO` (`Feature.PostCreate = 'CREATE:POST'`), sem escopo no enum — a abrangência
vive na concessão, como manda [src/config/CLAUDE.md](src/config/CLAUDE.md). As seis ações
são fechadas pelo modelo: `CREATE`, `VIEW`, `UPDATE`, `DELETE`, `PUBLISH`, `REVOKE` — com
`VIEW` cobrindo listagem **e** leitura de item, já que quem separa o que o ator enxerga é a
abrangência, não a ação.

> Os códigos do modelo são em inglês (`CREATE:POST`, `VIEW:MEDIA`, `REVOKE:CONSENT`, com o
> domínio `POST, MEDIA, REPORT, CONSENT, STUDENT, CLASS, USER`), enquanto as tabelas são em
> português. Seguir o DBML mantém código e modelo em acordo; um comentário por bloco liga
> cada código à sua tabela. **Se preferir tudo em português, é a hora de dizer** — depois
> disso a troca custa uma migration a mais.

**0.2 — Ajustar `shared/auth` para o v2.** Em
[src/shared/auth/actor.ts](src/shared/auth/actor.ts): remover `handle`, `id` passa a ser a
identidade estável. Em [src/shared/auth/authz.ts](src/shared/auth/authz.ts): `scopeOf()` lê
hoje `granted.split(':')[3]` (formato v1, de 4 segmentos) — passa a ler o índice 2 e a mapear
`PROPRIA→own`, `TURMA→group`, `ESCOLA→any`; em `ResourceScope`, `ownerHandle` vira
`ownerId`; a autenticação por token passa de `x-api-key` para `Authorization: Bearer`. O
resto da classe (`injectActor`, `canRequest`, `can`, `hasAnyScope`, leitura de cookie,
`hashToken`) já serve e **não deve ser reescrito**.

**0.3 — `ActorRepository` novo** em `src/modules/infra/repositories/actor.repository.ts`,
implementando o `IActorRepository` que já existe. Resolve o ator por token de sessão e por
API_TOKEN, agregando as concessões como `codigo || ':' || abrangencia` pelo caminho
`USUARIO → USUARIO_PERFIL → PERFIL → PERFIL_PERMISSAO → PERMISSAO`. Filtros obrigatórios:
`usuario.ativo`, `usuario_perfil.data_fim IS NULL`, `sessao.expira_em > now()` **e**
`sessao.expira_absoluto_em > now()` (o teto rígido do modelo). O token autentica **como** o
usuário dono — nunca com permissão própria.

**0.4 — Restaurar o `config/authz.ts`** e a linha `app.use(authz.injectActor)` no
[app.ts](src/main/app.ts), onde está o `TODO(authz)`. Ela precisa vir **antes** do
`setupRoutes`, senão as rotas nascem públicas.

**0.5 — Rotas públicas.** Login não pode exigir sessão. Estender
[src/config/routes.ts](src/config/routes.ts) para carregar `main/routes/publicas/` **antes**
do `injectActor` e o restante depois. É mais robusto que registrar a rota de login à mão no
`app.ts` e esquecer a ordem depois.

**0.6 — CTE de escopo de turma compartilhada** em
`src/modules/infra/repositories/sql/turma-escopo.ts`: as três origens de vínculo, para os
repositórios importarem em vez de reescrever. Espelha a view `turma_no_escopo` já criada em
[002_rls.sql](db/migrations/002_rls.sql).

**0.7 — Migration `004_catalogo_permissao.sql`** com as linhas de `PERMISSAO`, os 4 `PERFIL`
de sistema (`escola_id NULL`) e as concessões em `PERFIL_PERMISSAO`. A regra que o DBML
determina e não pode ser violada: **conteúdo de turma é abrangência `TURMA` para todo
perfil, inclusive direção** — quem enxerga mais turmas tem mais linhas em `ACESSO_TURMA`, e
o cargo não abre atalho. `ESCOLA` fica reservada a cadastro e configuração.

**0.8 — Instalar `@node-rs/argon2`** e um utilitário de hash/verify em
`src/shared/utils/password/`.

**0.9 — Corrigir a documentação desatualizada**, senão ela gera código no lugar errado:
[.claude/skills/criar-rota/SKILL.md](.claude/skills/criar-rota/SKILL.md) aponta para
`src/modules/zelo/...` (o segmento `zelo` não existe) e para `db/migrations/002_capabilities.sql`
(removido); [CLAUDE.md](CLAUDE.md) §9/§10 e [src/config/CLAUDE.md](src/config/CLAUDE.md)
ainda descrevem `handle` e `perfil_capability`.

## Fase 1 — Login e sessão

| Rota                    | Feature             | Observação                                                                                        |
| ----------------------- | ------------------- | ------------------------------------------------------------------------------------------------- |
| `POST /sessoes`         | `create-sessao`     | **Pública.** Verifica argon2id, gera token aleatório, grava só o SHA-256, devolve cookie httpOnly |
| `DELETE /sessoes/atual` | `revoke-sessao`     | Apaga a linha; registrar o encerramento no Mongo antes, como o DBML pede                          |
| `GET /sessoes/atual`    | `find-sessao-atual` | "Quem sou eu" — necessário para o front sobreviver a um refresh                                   |

Expiração deslizante: cada requisição autenticada atualiza `ultima_atividade_em` e
`expira_em`, respeitando `expira_absoluto_em`. Isso é uma escrita por requisição, dentro do
`injectActor` — custo conhecido e aceito, é o que o modelo especifica.

`find-sessao-atual` desvia do padrão `find-<recurso>-by-<campo>`; registrar a exceção no
`CLAUDE.md` em vez de deixá-la como precedente silencioso.

## Fase 2 — Primeira fatia vertical: postagens

Feita **antes** dos cadastros de propósito: é o caminho de escopo mais difícil, e valida o
desenho antes de replicá-lo vinte vezes.

`GET /postagens` (paginada, com filtro de escopo no SQL), `GET /postagens/:postagemId`,
`POST /postagens`, `PATCH /postagens/:postagemId`, `DELETE /postagens/:postagemId`.

Os 12 passos do [CLAUDE.md](CLAUDE.md) §12 valem integralmente aqui, e o resultado vira o
molde das fases seguintes. Pontos de atenção: a paginação vem pronta do banco
(`count(*) OVER ()` na CTE filtrada, projetando `PAGINA_ATUAL`/`LIMITE_PAGINA`/
`TOTAL_REGISTRO`/`TOTAL_PAGINA` — reaproveitar `paginationFromRow`); o envelope é montado no
controller via `paginated()`; o escopo é resolvido no controller com
`authz.hasAnyScope(actor, Feature.X) ? undefined : actor.id`.

## Fase 3 — Cadastros, em ordem de dependência

`escola` → `ano_letivo` → `turma` → `pessoa` → `usuario` → `aluno`/`responsavel`/`professor`
→ `matricula` → vínculos (`responsavel_aluno`, `professor_turma`, `acesso_turma`) →
`perfil`/`usuario_perfil`.

**Decisão de desenho a tomar aqui:** `PESSOA` é a entidade base e `ALUNO`/`RESPONSAVEL`/
`PROFESSOR` são papéis 0..1 sobre ela. `POST /alunos` deve aceitar os dados da pessoa e
criar as duas linhas numa transação — obrigar o cliente a orquestrar duas chamadas é
convite a pessoa órfã. Mas precisa aceitar também um `pessoaId` existente, porque é
exatamente assim que a professora que também é mãe ganha o segundo papel sem virar duas
pessoas.

## Fase 4 — Conteúdo e interação

`midia` (upload multipart — o `multer` entra **entre** a autorização e o validator, e a
escrita em disco fica **fora** da transação), `postagem_comentario` (remoção lógica, com
motivo obrigatório na moderação da escola), `postagem_reacao` (trocar de reação é `UPDATE`,
não linha nova).

## Fase 5 — Consentimento e relatório

`consentimento` é **série temporal, não booleano**: criar é linha nova, revogar é fechar
`vigencia_fim` da linha vigente — nunca `UPDATE` destrutivo. `relatorio_adaptacao` +
`relatorio_item`, com publicação exigindo `publicado_em`.

## Fase 6 — Ligar a RLS (defesa em profundidade)

Depois de tudo funcionando: `SET LOCAL app.usuario_id` por transação no
[pg-provider.ts](src/shared/infra/database/pg-provider.ts) e a aplicação conectando por um
papel **sem** `BYPASSRLS`. As políticas já existem e já foram testadas; falta o provider
alimentá-las. É o `TODO(rls)` do 002 — e é a evidência empírica do capítulo de resultados.

---

## Verificação

Depois de cada fatia vertical, o gate do projeto e o exercício dos erros:

```bash
npm run build        # noEmitOnError → build == typecheck
npm run lint:eslint:check && npm run lint:security
npm run dev
```

Cada endpoint precisa ser exercitado nos cinco caminhos, não só no feliz:
**401** sem cookie, **403** com ator sem a capability, **400** com corpo inválido
(conferindo que chave desconhecida é rejeitada pelo `strictObject`), **404** com id
inexistente, e o sucesso conferindo o formato exato do JSON.

O teste que importa para o TCC, e que deve ser refeito a cada fase: dois atores com sessões
distintas — um responsável com filho na turma e um usuário sem vínculo — pedindo a mesma
postagem. O primeiro recebe 200, o segundo 404. Enquanto a RLS não estiver ligada (Fase 6),
esse isolamento depende exclusivamente do filtro no SQL, então ele precisa ser verificado
endpoint a endpoint, não presumido.

## Riscos registrados

- **Duas fontes de verdade para o catálogo**: o enum `Feature` e a tabela `PERMISSAO`
  precisam concordar. Vale uma verificação no boot comparando os dois — barato, e evita um
  403 inexplicável em produção.
- **Migrations são imutáveis a partir de agora**: o migrator guarda checksum e recusa
  arquivo editado depois de aplicado. Toda mudança de esquema é arquivo novo.
- **Mudança destrutiva de esquema** (renomear ou remover coluna) deixa de ser gratuita assim
  que existir dado real.
