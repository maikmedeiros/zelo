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

Migrations `001`–`005` aplicadas. `src/modules/` tem **um** recurso: `sessions`. O
`injectActor` está global no [app.ts](src/main/app.ts), com as rotas públicas montadas antes
dele. `npm run build`, `lint:eslint:check` e `lint:security` passam limpos.

| Fase                          | Estado                                    |
| ----------------------------- | ----------------------------------------- |
| 0 — Fundação de autorização   | ✅ concluída (o 0.6 migrou para a Fase 2) |
| 1 — Login e sessão            | ✅ concluída e verificada                 |
| 1b — CRUD de tokens de API    | ⬜ **próxima**                            |
| 2 — Postagens                 | 🔶 2.1, 2.2 e 2.3 ✅ — falta 2.4 e 2.5    |
| 3 — Cadastros                 | ⬜                                        |
| 3b — Catálogo de perfis       | ⬜ (dívida aberta pela 0.7)               |
| 4 — Conteúdo e interação      | ⬜                                        |
| 5 — Consentimento e relatório | ⬜                                        |
| 6 — RLS                       | ⬜                                        |

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

**2.1 — Seed de demonstração** ✅ [db/seeds/demo.sql](db/seeds/demo.sql), aplicado por
`npm run db:seed`. Ficou **fora** de `db/migrations/` de propósito: migration roda sozinha no
boot em todo ambiente, e dado de teste com senha conhecida não pode viajar junto — é a mesma
dívida que a `004` já carrega e não vale repetir.

Cinco personas (senha `zelo123`), cobrindo as três origens de escopo e os dois controles
negativos:

| Login             | Perfil        | Vínculo                             | Turma resolvida |
| ----------------- | ------------- | ----------------------------------- | --------------- |
| `ana@zelo.test`   | `PROFESSOR`   | `PROFESSOR_TURMA` titular           | Maternal I A    |
| `bruno@zelo.test` | `RESPONSAVEL` | pai do Théo, matriculado            | Maternal I A    |
| `carla@zelo.test` | `RESPONSAVEL` | mãe da Lívia, matriculada           | Maternal II B   |
| `diana@zelo.test` | `COORDENACAO` | `ACESSO_TURMA` (motivo COORDENACAO) | Maternal I A    |
| `elias@zelo.test` | `RESPONSAVEL` | nenhum                              | —               |

Elias é a persona que importa: ele **tem** `VIEW:POST`, então uma falha de escopo aparece
como 200 indevido, não como 403 — é o que separa "faltou permissão" de "o recorte
funcionou". Carla é o controle mais fino: tem vínculo, mas com a outra turma.

Três postagens (uma publicada em cada turma, mais um rascunho na Turma A, para separar o
filtro de escopo do filtro de status), consentimentos, comentário e reação.

O seed também cria três **perfis de escola** (`PROFESSOR`, `RESPONSAVEL`, `COORDENACAO`,
`escola_id` preenchido, `sistema = false`) com 65 concessões seguindo a regra do modelo:
conteúdo de turma é `TURMA` inclusive para a coordenação; `ESCOLA` só em cadastro e
configuração. Eles **não** substituem a Fase 3b — os definitivos terão `escola_id NULL` e,
pelo índice `NULLS NOT DISTINCT`, convivem com estes sem colidir.

**2.2 — `GET /posts`** ✅ Os 12 arquivos do §12, com a CTE de escopo **inline** no
[post.repository.ts](src/modules/infra/repositories/post.repository.ts), parametrizada por
`@viewerId`.

Query: `page` (default 1), `limit` (default 20, teto 100), `classId` e `type`, todos
opcionais. Sem `classId` vem o feed de **todas** as turmas do ator; com ele, restringe — e
pedir uma turma fora do escopo devolve lista **vazia**, não 403: negar explicitamente
confirmaria que a turma existe.

Decisões tomadas aqui, que valem para as próximas rotas:

- **Só `PUBLICADA`.** Rascunho é do autor e depende de checagem de dono; entra na 2.5, junto
  com as escritas.
- **Escopo binário**, como manda o [CLAUDE.md](CLAUDE.md) §9: `ESCOLA` → `viewerId = null`
  (sem recorte); qualquer outra coisa → recorte pela CTE. `PROPRIA` em `VIEW:POST` não é
  modelada — ninguém concede, e inventar o caso agora seria abstração antecipada.
- **`z.guid()`, não `z.uuid()`.** O Zod 4 valida versão e variante RFC 4122 no `z.uuid()`, e
  os UUID sentinela do projeto (a escola padrão da `004`, todo o seed) são reprovados por
  ele — um `:id` vindo do próprio banco voltaria como 400. A regra está registrada em
  [validators/CLAUDE.md](src/modules/presentation/validators/CLAUDE.md).
- **`to_char(referente_a, 'YYYY-MM-DD')`** no SQL: o driver converteria `date` para um
  `Date` na meia-noite local, e o dia mudaria conforme o fuso.

**2.3 — Rodar o teste dos dois atores** ✅ Resultado, com as seis sessões:

| Ator    | Origem do escopo    | Vê                       |
| ------- | ------------------- | ------------------------ |
| `admin` | abrangência ESCOLA  | as duas postagens        |
| `ana`   | `PROFESSOR_TURMA`   | só a da Turma A          |
| `bruno` | `RESPONSAVEL_ALUNO` | só a da Turma A          |
| `diana` | `ACESSO_TURMA`      | só a da Turma A          |
| `carla` | `RESPONSAVEL_ALUNO` | só a da Turma B          |
| `elias` | nenhuma             | nada (`totalResults: 0`) |

O rascunho da Turma A não aparece para ninguém, e o `fabio` (sem perfil) recebe 403 — o que
separa "faltou capability" de "o recorte funcionou".

**2.4 — `GET /posts/:postId` e extração das CTEs** ✅

O detalhe devolve **o mesmo item da lista**, sem agregados. Comentários, reações e mídias
entram na Fase 4, quando tiverem rotas próprias — cada um é um join e uma decisão de escopo
por conta, e a 2.4 existe para validar o recorte no caminho do item, não para montar tela.

**404, nunca 403.** Postagem fora da audiência e postagem inexistente são indistinguíveis
para quem pede: negar por permissão confirmaria que ela existe. O repositório devolve `null`
e o use-case traduz — é a regra do [CLAUDE.md](CLAUDE.md) §7 aplicada ao caso em que o
recordset vazio _é_ a resposta de autorização.

As três CTEs saíram para
[infra/repositories/sql/turma-escopo.ts](src/modules/infra/repositories/sql/turma-escopo.ts),
agora com o segundo consumidor real — `visivelParaAtor(alias)` serve à lista e ao detalhe.
O arquivo também guarda a nota de que ele e as views da RLS são duas grafias da mesma regra.

**A pendência do array `students` foi resolvida aqui**, e não é cosmética: ver a postagem
não é ver todos os destinatários dela. `alunoVisivelParaAtor` recorta o array pelo ator —
cada um só enxerga os alunos sobre os quais tem vínculo (filho seu, ou criança de turma onde
é equipe); `ESCOLA` vê todos. `classes[]` continua completo: nome de turma não é dado
pessoal, e saber que um recado foi para duas turmas é contexto útil.

O efeito é visível em "Fotos do passeio", endereçada ao Théo (Turma A) e à Lívia (Turma B):

| Ator      | Vê a postagem | `students[]` |
| --------- | ------------- | ------------ |
| `admin`   | sim           | Lívia, Théo  |
| `ana`     | sim           | Théo         |
| `bruno`   | sim           | Théo         |
| `carla`   | sim           | Lívia        |
| `gabriel` | **404**       | —            |

Verificação dos cinco caminhos no detalhe: **401** sem cookie, **403** com o `fabio`,
**400** com `postId` fora do formato GUID, **404** para uuid inexistente, para rascunho
(inclusive para o `admin`) e para postagem fora da audiência, **200** com o formato exato.

**2.4b — Autoria como caminho de visibilidade e o filtro `authorId`** ✅

Duas lacunas encontradas ao revisar a 2.4, ambas fechadas:

**Autoria não era caminho de acesso.** A regra tinha três ramos — turma no escopo, aluno sob
responsabilidade, turma do aluno pela equipe — e nenhum olhava `autor_id`. O vínculo que dá
acesso na hora de escrever **expira**: a criança muda de turma, o professor troca de sala, e
quem escreveu perde o próprio texto. `visivelParaAtor` ganhou um quarto ramo.

Verificado em isolamento, encerrando o `professor_turma` da `ana`: ela mantém as duas
postagens que escreveu e perde "Recesso de setembro", de outro autor. Restaurado depois.

O mesmo vale para o conteúdo: o autor enxerga a lista **completa** de destinatários da
postagem dele — ele escolheu quem eram. Sem essa exceção, quem escrevesse para crianças de
turmas diferentes veria a própria postagem truncada.

**Filtro `authorId` na listagem**, para a aba "Minhas postagens" do front. É filtro de GUID,
não um `mine=true`: compõe com os demais e o front manda o próprio id, que ele já tem do
`GET /sessions/current`. O recorte de audiência continua valendo por cima — filtrar pelas
postagens de outra pessoa devolve só as que você já podia ver.

**Ponta solta para a 2.5:** a aba "Minhas postagens" de um professor deveria mostrar os
**rascunhos** dele, e a listagem só serve `PUBLICADA`. Rascunho do autor entra junto com as
escritas.

## Fase 2 — decisão registrada: abrangência ESCOLA em conteúdo

O `admin` enxerga postagem endereçada a aluno com quem não tem vínculo nenhum, porque o
perfil `ADMINISTRADOR` tem `VIEW:POST` com abrangência `ESCOLA` e `ESCOLA` ignora vínculo por
definição. Isso **contraria a regra da 0.7** — conteúdo de turma é `TURMA` para todo perfil —
e é a dívida de bootstrap que a `004` assume em caixa alta.

Avaliado e **mantido como está** por ora; a correção pertence à Fase 3b, rebaixando as
capabilities de conteúdo do `ADMINISTRADOR` para `TURMA` e dando a ele `ACESSO_TURMA` onde
precisar enxergar. Vale lembrar que os perfis `PROFESSOR`, `RESPONSAVEL` e `COORDENACAO` do
seed já seguem a regra: nenhum deles tem conteúdo em `ESCOLA`.

**2.5 — Escritas** ✅ São **quatro** rotas, não três: o catálogo tem `PUBLISH:POST` separado
de `UPDATE:POST`, e o modelo trata publicar como transição de estado, não edição de campo.

| Rota                              | Capability     | Observação                                            |
| --------------------------------- | -------------- | ----------------------------------------------------- |
| `POST /posts`                     | `CREATE:POST`  | nasce `RASCUNHO`; autoria sai do ator, nunca do corpo |
| `PATCH /posts/:postId`            | `UPDATE:POST`  | parcial; audiência só enquanto rascunho               |
| `POST /posts/:postId/publication` | `PUBLISH:POST` | rota própria, antes da rota de param                  |
| `DELETE /posts/:postId`           | `DELETE:POST`  | lógico: `status = REMOVIDA`                           |

### Escopo de escrita — o que não existia antes

Até aqui todo escopo era de leitura. Endereçar é escrita, e `CREATE:POST:TURMA` viraria
`ESCOLA` na prática se bastasse mandar o id de qualquer turma no corpo. `assertTargetsInScope`
consulta quais alvos estão fora e lança `403` listando-os no `cause`.

O escopo usado é **o mesmo da leitura** (as três origens), não só o de equipe: abrangência
`TURMA` significa "as minhas turmas", e ter duas definições dela seria armadilha. Restringir a
escrita a professor e acesso concedido é trocar `TURMA_NO_ESCOPO` por `TURMA_DA_EQUIPE` nas
duas consultas.

### Checagem de dono — o primeiro uso real do `authz.can`

`makePostGuard` monta o callback que o use-case recebe, mantendo o `authz` fora da aplicação.
Como a postagem alcança várias turmas e `ResourceScope` carrega uma só, a abrangência `TURMA`
é testada turma a turma e basta uma passar; a chamada sem `groupId` cobre `PROPRIA` e `ESCOLA`.

Falha de guard é **404, não 403** — mesma razão da 2.4.

### Rascunho

`status=RASCUNHO` na listagem devolve **só o que o próprio ator escreveu**, inclusive para
quem tem abrangência `ESCOLA`: rascunho não tem audiência, não chegou a ninguém. Por isso o
filtro usa `actorId`, e não `viewerId`. Vale também no detalhe — sem isso o autor não abriria
o próprio rascunho por id, que foi um bug encontrado no teste.

Efeito colateral do rascunho: `publishedAt` passou a ser **anulável** na entity e na saída.

### Regras de transição

- **Publicar exige corpo.** O modelo pede corpo OU ao menos uma mídia; mídia é Fase 4, então
  por ora só o corpo satisfaz. `TODO(midia)` marca o ponto onde a condição relaxa. → `422`
- **Republicar é conflito**, não violação de regra. → `409`
- **Audiência é imutável depois de publicada.** Mudar destinatário é tirar de quem já leu ou
  entregar a quem não recebeu, e o modelo não registra nem uma coisa nem outra. → `422`

### Verificação

Ciclo completo exercitado: criar (`201`, nasce sem `publishedAt`) → editar (`200`) →
publicar (`200`, com data) → aparecer no feed do responsável → remover (`204`) → sumir do
feed, `404` por id, e a **linha permanece no banco com `status = REMOVIDA`**.

Escopo de escrita: a `ana` cria para a Turma A e para o Théo (aluno dela) — `201`; para a
Turma B e para a Lívia (aluna da B) — `403` com o id no `cause`. O `bruno`, sem
`CREATE:POST`, — `403`. Corpo misturando os dois modos e chave desconhecida — `400`.

Dono: a `ana` edita a própria; a `diana` (coordenação com `UPDATE:POST:TURMA` na turma)
também edita — é o que a concessão diz, e serve à moderação; o `bruno`, sem a capability,
`403`.

Matriz de audiência intacta depois de tudo: 5 / 4 / 4 / 4 / 2 / 3.

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

O dado para esse teste já existe (passo 2.1): `bruno` deve receber 200 na postagem da Turma
A, `carla` e `elias` devem receber 404 na mesma postagem. Rodando o recorte direto no banco,
a divisão já é a esperada — falta a rota que o aplique.

Um detalhe que o seed torna visível: o `admin` não tem vínculo de turma nenhum, então a CTE
de escopo devolve **zero** postagens para ele. Isso está correto — ele enxerga tudo pela
abrangência `ESCOLA`, e é o controller que decide não aplicar o filtro
(`scopesOf(...).includes('ESCOLA') ? undefined : actor.id`). Se a listagem vier vazia para o
administrador, o erro está nessa linha, não no SQL.

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
