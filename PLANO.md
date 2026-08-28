# Plano de ação — reconstruir a API sobre o esquema v2

## Contexto

**Ponto de partida.** O banco foi migrado para o modelo v2 (33 tabelas) e `src/modules/` foi
esvaziada por completo: não existia mais nenhum controller, use-case, repositório, validator,
factory ou rota. Também tinham saído o `src/config/authz.ts` e a linha
`app.use(authz.injectActor)` do [app.ts](src/main/app.ts), porque o `ActorRepository`
consultava tabelas do v1 que não existem mais.

O que sobreviveu intacto é toda a infraestrutura genérica em `src/shared/` — adapters,
protocols, presenters, errors, middlewares, storage, metrics, o provider do Postgres e o
migrator. É sobre ela que a reconstrução acontece.

**Resultado pretendido:** uma API funcional com login, autorização por perfil e escopo de
turma, e os CRUDs que sustentam a demonstração do TCC.

## Estado atual — 28/08/2026

Migrations `001`–`004` aplicadas. `src/modules/` tem **um** recurso: `sessions`. O
`injectActor` está global no [app.ts](src/main/app.ts), com as rotas públicas montadas antes
dele. `npm run build`, `lint:eslint:check` e `lint:security` passam limpos.

| Fase                          | Estado                                                |
| ----------------------------- | ----------------------------------------------------- |
| 0 — Fundação de autorização   | ✅ concluída (o 0.6 migrou para a Fase 2)             |
| 1 — Login e sessão            | ✅ concluída e verificada                             |
| 1b — CRUD de tokens de API    | ⬜ **próxima**                                        |
| 2 — Postagens                 | ⬜ (precisa do seed de demonstração para ser aferida) |
| 3 — Cadastros                 | ⬜                                                    |
| 3b — Catálogo de perfis       | ⬜ (dívida aberta pela 0.7)                           |
| 4 — Conteúdo e interação      | ⬜                                                    |
| 5 — Consentimento e relatório | ⬜                                                    |
| 6 — RLS                       | ⬜                                                    |

Verificação da Fase 1 executada contra `localhost:3003`, com o administrador de bootstrap:
`201` no login (com `Set-Cookie` httpOnly), `200` no `sessions/current` (69 capabilities,
todas `:ESCOLA`), `400` para chave desconhecida e corpo vazio, `401` para senha errada, para
ausência de credencial e para Bearer sem o prefixo `zelo_`, `404` em rota inexistente, `204`
no logout e `401` no acesso seguinte — a sessão é revogada de fato.

## Decisões já tomadas

| Decisão       | Escolha                                                              |
| ------------- | -------------------------------------------------------------------- |
| Escopo        | MVP do TCC — fora: notificação e visão computacional                 |
| Transporte    | Cookie httpOnly para sessão + `Authorization: Bearer` para API_TOKEN |
| Hash de senha | `@node-rs/argon2` (binários pré-compilados, sem node-gyp)            |
| Dados padrão  | Catálogo de permissões derivado do modelo, como migration numerada   |
| Sessão        | 7 dias de inatividade (`expira_em` desliza) + teto rígido de 30 dias |
| Idioma        | Código e URL em inglês; banco (tabela, coluna, alias) em português   |

## Por que autorização antes dos CRUDs

Não é preferência de estilo — é o formato deste código:

- **O escopo mora dentro do SQL.** O repositório de postagens que existia carregava a CTE
  `turma_visivel` embutida em toda consulta. No v2 o escopo tem três origens
  (`RESPONSAVEL_ALUNO→MATRICULA`, `PROFESSOR_TURMA`, `ACESSO_TURMA`). Uma listagem escrita
  sem isso não é "uma query faltando middleware" — é outra query.
- **Toda escrita grava autoria** (`postagem.autor_id`, `consentimento.registrado_por`,
  `acesso_turma.concedido_por`), que sai do ator.
- **A interface `Actor` precisa mudar** antes de qualquer controller: tinha `handle: string`,
  e o v2 não tem `handle`.
- **`canRequest(Feature.X)` é o primeiro middleware de toda rota** — o catálogo precisa
  estar decidido antes do primeiro arquivo de rota.
- **Sem login nada é testável**: com o `injectActor` global, tudo responde 401.

---

## Fase 0 — Fundação de autorização ✅

Nada aqui expõe endpoint; é o alicerce de todo o resto.

**Estado:** concluída. Duas ressalvas registradas abaixo:

- O **0.6** saiu desta fase. Abstração sem consumidor não se verifica — a regra do
  [CLAUDE.md](CLAUDE.md) §10 é explícita — e a CTE não tem como ser aferida sem query nem
  dado. Virou o passo **2.4** da Fase 2.
- O **0.7** entregou só o perfil de bootstrap. Os demais perfis de sistema e a regra de
  abrangência `TURMA` viraram a **Fase 3b**.

**0.1 — Redefinir o catálogo de capability.** ✅
[src/config/features.ts](src/config/features.ts) no formato do v2: `PERMISSAO.codigo` é
`ACAO:RECURSO` (`Feature.PostCreate = 'CREATE:POST'`), sem escopo no enum — a abrangência
vive na concessão, como manda [src/config/CLAUDE.md](src/config/CLAUDE.md). As seis ações
são fechadas pelo modelo: `CREATE`, `VIEW`, `UPDATE`, `DELETE`, `PUBLISH`, `REVOKE` — com
`VIEW` cobrindo listagem **e** leitura de item, já que quem separa o que o ator enxerga é a
abrangência, não a ação. **69 capabilities**, em inglês, espelhando o DBML.

**0.2 — Ajustar `shared/auth` para o v2.** ✅ `handle` saiu de
[src/shared/auth/actor.ts](src/shared/auth/actor.ts) e o `id` passou a ser a identidade
estável. A classe monolítica virou funções em `src/shared/auth/functions/`
(`can`, `can-request`, `inject-actor`, `session-cookie`) mais o
[model/actor-model.ts](src/shared/auth/model/actor-model.ts), montadas por `createAuth`. O
helper de escopo é **`scopesOf(actor, feature): Scope[]`** — lê o índice 2 do código
concedido, no formato de 3 segmentos do v2. A autenticação por token passou de `x-api-key`
para `Authorization: Bearer`, com precedência sobre o cookie.

**0.3 — `ActorRepository` novo** ✅ em
[src/modules/infra/repositories/actor.repository.ts](src/modules/infra/repositories/actor.repository.ts).
Resolve o ator por token de sessão e por API_TOKEN, agregando as concessões como
`codigo || ':' || abrangencia` pelo caminho
`USUARIO → USUARIO_PERFIL → PERFIL → PERFIL_PERMISSAO → PERMISSAO`. Filtros aplicados:
`usuario.ativo`, janela de vigência de `usuario_perfil`, `sessao.expira_em > now()` **e**
`sessao.expira_absoluto_em > now()` (o teto rígido do modelo). O token autentica **como** o
usuário dono — nunca com permissão própria. A expiração deslizante é uma CTE `renovada` que
faz `UPDATE ... RETURNING` na mesma ida ao banco da leitura do ator.

**0.4 — Restaurar o `config/authz.ts`** ✅ e a linha `app.use(authz.injectActor)` no
[app.ts](src/main/app.ts), depois dos body parsers e do logger, antes das rotas privadas.

**0.5 — Rotas públicas.** ✅ [src/config/routes.ts](src/config/routes.ts) carrega
`main/routes/public/` **antes** do `injectActor` e o restante depois, via
`setupPublicRoutes` / `setupPrivateRoutes`. A pasta é a declaração: não existe sinalizador
nem lista, e a granularidade é o arquivo.

**0.7 — Migration [004_catalogo_permissao.sql](db/migrations/004_catalogo_permissao.sql)** ⚠️
parcial. Entregou as 69 linhas de `PERMISSAO`, a escola padrão, **um** perfil
(`ADMINISTRADOR`, com `escola_id` preenchido — não `NULL`), as 69 concessões desse perfil
todas com abrangência `ESCOLA`, o usuário `admin`/`admin` e o token de API de bootstrap.

O que **não** foi entregue e migrou para a Fase 3b: os demais perfis de sistema e a regra que
o DBML determina — **conteúdo de turma é abrangência `TURMA` para todo perfil, inclusive
direção**; quem enxerga mais turmas tem mais linhas em `ACESSO_TURMA`, e o cargo não abre
atalho. `ESCOLA` fica reservada a cadastro e configuração. O perfil de bootstrap é a exceção
consciente a essa regra, e o comentário no topo da migration diz isso.

**0.8 — Instalar `@node-rs/argon2`** ✅ e o utilitário de hash/verify em
`src/shared/utils/password/`. O `create-session` compara contra um hash-isca quando o usuário
não existe, para não vazar a existência do login pelo tempo de resposta.

**0.9 — Corrigir a documentação desatualizada** ✅ — nenhuma referência a `src/modules/zelo`,
`002_capabilities.sql`, `handle` ou `perfil_capability` sobrou em
[CLAUDE.md](CLAUDE.md), [src/config/CLAUDE.md](src/config/CLAUDE.md) ou
[.claude/skills/criar-rota/SKILL.md](.claude/skills/criar-rota/SKILL.md).

## Fase 1 — Login e sessão ✅

As rotas nasceram em inglês, como manda o [CLAUDE.md](CLAUDE.md) §3 — o que continua em
português é só o banco.

| Rota                       | Feature                | Observação                                                                                        |
| -------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------- |
| `POST /sessions`           | `create-session`       | **Pública.** Verifica argon2id, gera token aleatório, grava só o SHA-256, devolve cookie httpOnly |
| `GET /sessions/current`    | `find-current-session` | "Quem sou eu" — necessário para o front sobreviver a um refresh                                   |
| `DELETE /sessions/current` | `revoke-session`       | Apaga a linha e limpa o cookie                                                                    |

Expiração deslizante: cada requisição autenticada atualiza `ultima_atividade_em` e
`expira_em`, respeitando `expira_absoluto_em`. Isso é uma escrita por requisição, dentro do
`injectActor` — custo conhecido e aceito, é o que o modelo especifica.

`find-current-session` desvia do padrão `find-<recurso>-by-<campo>` porque `current` é
seletor, não campo; a exceção está registrada no [CLAUDE.md](CLAUDE.md) §3.

**Pendência da fase:** o DBML pede o registro do encerramento da sessão no Mongo, antes do
`DELETE`. O `revoke-session` ainda não faz isso.

**Documentação:** a coleção `Zelo` no Postman cobre as três rotas com os valores do
administrador de bootstrap, mais o `/metrics`. Um detalhe que custou tempo e vale lembrar:
como o Bearer tem precedência sobre o cookie, um header `Authorization` presente e vazio
derruba a autenticação mesmo com cookie válido — e um header `Cookie` explícito sobrepõe o
cookie jar do cliente.

## Fase 1b — CRUD de tokens de API

**Próxima fase.** Entrou no escopo depois: o `API_TOKEN` estava fora do MVP, mas o token
semeado na `004` é credencial fixa versionada no git, válida por 90 dias, e isso não sobrevive
a um ambiente exposto. Este CRUD é o que permite aposentá-lo.

O mecanismo de autenticação **já existe e está verificado** (`findActorByApiToken`, prefixo,
`Authorization: Bearer`). Falta só a gestão.

| Rota                          | Capability         | Observação                                                             |
| ----------------------------- | ------------------ | ---------------------------------------------------------------------- |
| `POST /api-tokens`            | `CREATE:API_TOKEN` | Devolve o valor em claro **uma única vez**, no corpo do 201            |
| `GET /api-tokens`             | `VIEW:API_TOKEN`   | Lista `prefixo`, nome, ambiente, validade e último uso — nunca o token |
| `DELETE /api-tokens/:tokenId` | `REVOKE:API_TOKEN` | Revogação **lógica**: grava `revogado_em`/`revogado_por`               |

**Antes das rotas**, três capabilities novas no enum `Feature` (`ApiTokenCreate`,
`ApiTokenView`, `ApiTokenRevoke`) e a **migration `005`** inserindo-as em `PERMISSAO` e
concedendo em `PERFIL_PERMISSAO` — a `004` já rodou e o migrator recusa arquivo editado
depois de aplicado.

Abrangência: `PROPRIA` para todo perfil que possa ter token (cada um administra os seus);
`ESCOLA` só para quem precise auditar os alheios. Serão as **primeiras concessões não-`ESCOLA`
do banco** — ou seja, o primeiro exercício real do `scopesOf` fora do caminho do administrador.

Regras que o modelo impõe e o CRUD tem de respeitar:

- **`expira_em` é obrigatório e o teto é 90 dias.** Não existe token eterno — é a nota do
  DBML, e o `NOT NULL` do banco já cumpre metade.
- **Só o SHA-256 é persistido.** O valor em claro existe uma vez, na resposta do `POST`.
- **`prefixo` em claro** para a tela identificar qual token revogar sem revelar o segredo.
- **Revogar é `UPDATE`, nunca `DELETE`** — apagar a linha destruiria o rastro de que aquele
  token existiu e foi usado.
- **O token herda as permissões do dono, nem mais nem menos.** Não há segunda árvore de
  autorização; o `ActorRepository` já resolve pelo mesmo caminho da sessão.

Duas pontas soltas do que já existe, confirmadas no código, que cabem aqui:

- `ultimo_uso_em` e `ultimo_uso_ip` **não são atualizados** — `SELECT_ACTOR_BY_API_TOKEN` é
  só leitura, ao contrário do caminho da sessão, que já renova. Sem isso, a listagem não tem
  o que mostrar.
- A coluna `ambiente` **não é verificada** em lugar nenhum. Um token `DESENVOLVIMENTO`
  autentica em produção do mesmo jeito. A checagem entra no `findActorByApiToken`.

## Fase 2 — Primeira fatia vertical: postagens

Feita **antes** dos cadastros de propósito: é o caminho de escopo mais difícil, e valida o
desenho antes de replicá-lo vinte vezes.

`GET /posts` (paginada, com filtro de escopo no SQL), `GET /posts/:postId`, `POST /posts`,
`PATCH /posts/:postId`, `DELETE /posts/:postId`.

Os 12 passos do [CLAUDE.md](CLAUDE.md) §12 valem integralmente aqui, e o resultado vira o
molde das fases seguintes. Pontos de atenção: a paginação vem pronta do banco
(`count(*) OVER ()` na CTE filtrada, projetando `PAGINA_ATUAL`/`LIMITE_PAGINA`/
`TOTAL_REGISTRO`/`TOTAL_PAGINA` — reaproveitar `paginationFromRow`); o envelope é montado no
controller via `paginated()`; o escopo é resolvido no controller com
`authz.scopesOf(actor, Feature.X).includes('ESCOLA') ? undefined : actor.id`.

**Ordem interna, porque uma coisa depende da outra:**

**2.1 — Seed de demonstração** (migration `006`, ou script separado se preferir não versionar
dado de teste). Hoje o banco tem **um** usuário: o `admin`, sem turma nenhuma. Sem um
responsável com filho matriculado e um usuário sem vínculo, o recorte de escopo não tem como
ser exercido — e é exatamente o dado do teste que sustenta o capítulo de resultados.

**2.2 — `GET /posts`** com a CTE de escopo **inline** no `PostRepository`, parametrizada por
`@usuarioId`.

**2.3 — Rodar o teste dos dois atores** (200 e 404, detalhado em Verificação). É aqui que a
regra de escopo é validada, ainda concentrada em um lugar só.

**2.4 — `GET /posts/:postId` e extração da CTE** para
`src/modules/infra/repositories/sql/turma-escopo.ts` — as três origens do vínculo, para os
repositórios importarem em vez de reescrever. Este é o antigo item 0.6, movido para cá: a
extração acontece no **segundo** consumidor, com o primeiro já provado.

Sobre a CTE, uma armadilha registrada: ela **não pode ser copiada** da view
`turma_no_escopo` de [002_rls.sql](db/migrations/002_rls.sql). A view filtra por
`app_usuario_id()`, que lê o GUC de sessão — alimentado só na Fase 6. A versão da aplicação
precisa ser parametrizada. São duas grafias da mesma regra, e elas têm de concordar:
divergência silenciosa entre as duas é precisamente o que a Fase 6 vai medir. Vale um
comentário em cada uma apontando para a outra.

**2.5 — `POST`, `PATCH`, `DELETE`**, com a checagem de dono via
`authz.can(actor, Feature.X, { ownerId, groupId })` recebida pelo use-case como callback.

## Fase 3 — Cadastros, em ordem de dependência

`escola` → `ano_letivo` → `turma` → `pessoa` → `usuario` → `aluno`/`responsavel`/`professor`
→ `matricula` → vínculos (`responsavel_aluno`, `professor_turma`, `acesso_turma`) →
`perfil`/`usuario_perfil`.

**Decisão de desenho a tomar aqui:** `PESSOA` é a entidade base e `ALUNO`/`RESPONSAVEL`/
`PROFESSOR` são papéis 0..1 sobre ela. `POST /students` deve aceitar os dados da pessoa e
criar as duas linhas numa transação — obrigar o cliente a orquestrar duas chamadas é
convite a pessoa órfã. Mas precisa aceitar também um `personId` existente, porque é
exatamente assim que a professora que também é mãe ganha o segundo papel sem virar duas
pessoas.

## Fase 3b — Catálogo de perfis de sistema

A dívida que a 0.7 deixou aberta. Migration nova com os perfis que faltam
(direção, professor, responsável) e as concessões em `PERFIL_PERMISSAO` seguindo a regra:
**conteúdo de turma é `TURMA` para todo perfil**, `ESCOLA` só para cadastro e configuração.

Fica depois da Fase 3 porque perfil tem `escola_id`, e a decisão de o perfil de sistema ser
por escola ou global (`escola_id NULL`) só fecha quando o cadastro de escola existir — o
`ADMINISTRADOR` da `004` foi criado preso à escola padrão, e isso precisa ser revisto ou
assumido.

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

A RLS **não aposenta** o filtro de escopo no SQL da aplicação: as duas camadas coexistem, é
essa a definição de defesa em profundidade. O que muda é que o filtro deixa de ser a única
linha de defesa.

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

A coleção `Zelo` no Postman é onde esses casos ficam registrados, com exemplo de resposta por
status.

O teste que importa para o TCC, e que deve ser refeito a cada fase: dois atores com sessões
distintas — um responsável com filho na turma e um usuário sem vínculo — pedindo a mesma
postagem. O primeiro recebe 200, o segundo 404. Enquanto a RLS não estiver ligada (Fase 6),
esse isolamento depende exclusivamente do filtro no SQL, então ele precisa ser verificado
endpoint a endpoint, não presumido.

**Este teste ainda não pode rodar**: o banco tem um único usuário (`admin`), sem vínculo de
turma. É o que o passo 2.1 resolve, e é por isso que ele vem antes da primeira query com
escopo.

## Riscos registrados

- **Duas fontes de verdade para o catálogo**: o enum `Feature` e a tabela `PERMISSAO`
  precisam concordar. Conferido na mão em 28/08/2026 — **69 códigos de cada lado, idênticos**.
  A verificação automática no boot ainda não existe; vale fazer, é barata e evita um 403
  inexplicável em produção.
- **Duas fontes de verdade para o escopo de turma**: a view `turma_no_escopo` (RLS) e a CTE
  da aplicação (passo 2.4). Ver a ressalva na Fase 2.
- **Migrations são imutáveis a partir de agora**: o migrator guarda checksum e recusa
  arquivo editado depois de aplicado. Toda mudança de esquema é arquivo novo — a `004` já
  rodou, então capability nova é migration nova.
- **Credenciais de bootstrap versionadas no git**: usuário `admin`/`admin` e o token de API
  com 90 dias de validade. A Fase 1b existe para aposentar o token; a senha precisa ser
  trocada antes de qualquer ambiente exposto.
- **Mudança destrutiva de esquema** (renomear ou remover coluna) deixa de ser gratuita assim
  que existir dado real.
