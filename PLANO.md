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

Migrations `001`–`008` aplicadas. `src/modules/` cobre **quinze** recursos: `sessions`,
`posts`, `school-years`, `classes`, `people`, `users`, `students`, `guardians`, `teachers`,
`enrollments`, `guardian-links`, `teacher-links`, `class-accesses`, `roles` e `role-grants` —
**64 rotas**. O `injectActor` está global no [app.ts](src/main/app.ts), com as rotas públicas
montadas antes dele. `npm run build`, `lint:eslint:check`, `lint:security` e
`prettier --check` passam limpos.

| Fase                          | Estado                                    |
| ----------------------------- | ----------------------------------------- |
| 0 — Fundação de autorização   | ✅ concluída (o 0.6 migrou para a Fase 2) |
| 1 — Login e sessão            | ✅ concluída e verificada                 |
| 2 — Postagens                 | ✅ concluída (2.1 a 2.5)                  |
| 3 — Cadastros                 | ✅ concluída (3.1 a 3.6)                  |
| 3b — Catálogo de perfis       | ✅ concluída (migration 007)              |
| 4 — Conteúdo e interação      | 🔄 4.0 feita; 4.1 a 4.3 pendentes         |
| 5 — Consentimento e relatório | ⬜                                        |
| 6 — RLS                       | ⬜                                        |
| 7 — CRUD de tokens de API     | ⬜ (era 1b; adiada para o fim)            |

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

**Não é pendência:** o `createRequestResponseLogger` já grava **toda** requisição no Mongo —
método, caminho, status, ator e duração — e o `DELETE /sessions/current` não está entre os
caminhos excluídos (`/status`, `/health`, `/metrics`). O registro do encerramento acontece
pelo log genérico; o Mongo neste projeto é só log, e não precisa de escrita dedicada.

**Documentação:** a coleção `Zelo` no Postman cobre **as 61 rotas em 16 pastas**, com corpo
de exemplo em toda escrita e query de exemplo (desabilitada) em toda listagem. Um detalhe que
custou tempo e vale lembrar: como o Bearer tem precedência sobre o cookie, um header
`Authorization` presente e vazio derruba a autenticação mesmo com cookie válido — e um header
`Cookie` explícito sobrepõe o cookie jar do cliente.

**Convenção da coleção:** cada segmento **estático** da URL vira uma pasta; o parâmetro não
vira. `POST /posts/:postId/publication` mora em `Posts › publication`.

**Armadilha do MCP do Postman:** não existe ferramenta de criar pasta — só o `putCollection`,
que **apaga a descrição da coleção e as descrições, scripts e exemplos de todo item**. O
caminho que funciona é: `putCollection` uma vez para criar o esqueleto de pastas (guardando
os ids existentes), restaurar os itens danificados com `updateCollectionRequest`, e daí em
diante criar tudo com `createCollectionRequest`, que aceita `description`, `events` e
`queryParams` com `enabled: false`.

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

O escopo de escrita é **mais estreito que o de leitura**, por decisão de produto de
28/08/2026: só `PROFESSOR_TURMA` e `ACESSO_TURMA`. A ferramenta é a escola comunicando com as
famílias — o responsável lê e comenta, não publica. Deixar a escrita seguir o escopo de
leitura daria a um responsável, se algum dia recebesse `CREATE:POST`, o direito de endereçar
postagem às outras crianças da sala do filho.

No modo `ALUNO` a mesma regra vista pelo aluno: só se endereça criança matriculada em turma
onde o ator é equipe. Verificado: a `ana` cria para a Turma A, para o Théo e para a Helena
(ambos matriculados nela) e é recusada na Turma B; a `diana`, que chega pela `ACESSO_TURMA`,
cria normalmente.

Comunicação no sentido inverso — família falando com a escola — fica fora do MVP; quando
entrar, é recurso próprio, não postagem.

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

### Fase 7 — CRUD de tokens de API

**Última fase, por decisão de 28/08/2026.** Nasceu como 1b e foi adiada duas vezes: não é
crucial enquanto não houver ambiente exposto. O token semeado na `004` é credencial fixa
versionada no git, válida por 90 dias — este CRUD é o que permite aposentá-lo, e a hora de
fazê-lo é antes do primeiro deploy fora da máquina de desenvolvimento.

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

## Verificação

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

`ano_letivo` → `turma` → `pessoa` → `usuario` → `aluno`/`responsavel`/`professor` →
`matricula` → vínculos (`responsavel_aluno`, `professor_turma`, `acesso_turma`) →
`perfil`/`usuario_perfil`.

**Sem `POST /schools`.** O sistema roda com **uma** escola por enquanto, a que a `004`
provisiona. Nenhuma rota recebe `schoolId`: a escola sai do **ator**, pelo caminho
`usuario → pessoa → escola_id`, dentro do próprio SQL. Quando a segunda escola existir, o
recorte já está no lugar — o que falta é a rota de cadastro, não a regra.

**Pessoa e papel são duas chamadas, nesta ordem.** `POST /people` cria a pessoa; depois
`POST /students`, `POST /guardians` ou `POST /teachers` recebe o `personId` e cria **só** a
linha do papel. É assim que a professora que também é mãe ganha o segundo papel sem virar
duas pessoas — e é o índice `uq_pessoa_cpf` que impede o operador de cadastrá-la de novo.

A alternativa (aceitar os dados da pessoa junto com o papel, numa transação) foi
**descartada**: ela empurra o operador para "cadastrar de novo" sempre que a busca falha, e
o resultado é pessoa duplicada — login pendurado numa linha, vínculo do filho na outra, sem
erro nenhum, e o consentimento de LGPD apontando para a errada. O fluxo de duas etapas troca
essa falha silenciosa por uma visível e barata: uma pessoa sem papel, sem FK apontando para
ela, resolvida por varredura quando incomodar.

Duas consequências que o fluxo exige:

- **CPF obrigatório no papel adulto.** `POST /people` mantém o CPF opcional — criança sem
  CPF é a regra, não a exceção, e a `001` diz isso no comentário do índice. Mas
  `POST /guardians` e `POST /teachers` recusam pessoa sem CPF: no PostgreSQL `NULL` não
  colide com `NULL`, então sem CPF preenchido o índice único **não protege nada**. Exigir o
  CPF onde a duplicata dói é o que faz a garantia existir de fato.
- **Busca de pessoa antes do cadastro.** `GET /people?cpf=` / `?search=`, senão não há como
  achar a Ana que já existe, e o caminho prático vira criar outra.

**Ordem interna:**

**3.1 — `ano_letivo` e `turma`.** Os dois recursos que tudo o mais referencia. Sem eles não
há matrícula nem vínculo, e o seed é a única fonte de turma no banco.

**3.2 — `pessoa`**, com a busca. **3.3 — `usuario`** (a senha vem no corpo, decisão do
cliente — o servidor só aplica o argon2id). **3.4 — os papéis** `aluno`, `responsavel`,
`professor`. **3.5 — `matricula` e os vínculos.** **3.6 — `perfil` e `usuario_perfil`.**

### 3.1 — `ano_letivo` e `turma` ✅

| Rota                                 | Feature              |
| ------------------------------------ | -------------------- |
| `GET /school-years`                  | `VIEW:SCHOOL_YEAR`   |
| `GET /school-years/:schoolYearId`    | `VIEW:SCHOOL_YEAR`   |
| `POST /school-years`                 | `CREATE:SCHOOL_YEAR` |
| `PATCH /school-years/:schoolYearId`  | `UPDATE:SCHOOL_YEAR` |
| `DELETE /school-years/:schoolYearId` | `DELETE:SCHOOL_YEAR` |
| `GET /classes`                       | `VIEW:CLASS`         |
| `GET /classes/:classId`              | `VIEW:CLASS`         |
| `POST /classes`                      | `CREATE:CLASS`       |
| `PATCH /classes/:classId`            | `UPDATE:CLASS`       |
| `DELETE /classes/:classId`           | `DELETE:CLASS`       |

Decisões tomadas aqui, que valem para o resto da Fase 3:

- **A escola sai do ator, no SQL.** `escolaDoAtor()` em
  [sql/escola-do-ator.ts](src/modules/infra/repositories/sql/escola-do-ator.ts) é a
  subconsulta única; nenhum corpo de requisição carrega `schoolId`.
- **Conflito de índice único vira 409, não 500.** `INSERT ... ON CONFLICT DO NOTHING
RETURNING id` devolve recordset vazio, o repositório devolve `null` e o use-case lança
  `ConflictError`. Nada de `try/catch` em cima do erro do driver.
- **`UPDATE` guardado por `NOT EXISTS`.** O `ON CONFLICT` não existe para `UPDATE`, então a
  colisão com o irmão vira uma condição no `WHERE`. Como o use-case já leu o recurso antes
  (404), zero linhas depois disso só pode ser conflito.
- **`DELETE` é físico e guardado.** `ano_letivo` e `turma` são referenciados com
  `ON DELETE RESTRICT` — a FK barraria com 500. O `NOT EXISTS` no `WHERE` transforma isso em
  **409** dizendo o que trava. Cadastro não tem remoção lógica: quem foi usado não sai, quem
  não foi é erro de digitação.
- **`GET /classes` é recortado pela abrangência**, com as três origens
  (`TURMA_NO_ESCOPO`) — o responsável enxerga a turma do filho pelo nome, e o professor as
  dele. `VIEW:CLASS` com `ESCOLA` dispensa o recorte. Turma fora do escopo devolve **404**
  no item e some da lista, nunca 403.
- **Datas em `to_char(..., 'YYYY-MM-DD')`**, pelo mesmo motivo da 2.2: o driver converteria
  `date` para `Date` na meia-noite local e o dia mudaria conforme o fuso.
- **Contagens no payload** (`classCount` no ano letivo, `studentCount` na turma) existem
  para o front explicar o 409 antes de tentar apagar.

### 3.2 — `pessoa`, com a busca ✅

| Rota                      | Feature         |
| ------------------------- | --------------- |
| `GET /people`             | `VIEW:PERSON`   |
| `GET /people/:personId`   | `VIEW:PERSON`   |
| `POST /people`            | `CREATE:PERSON` |
| `PATCH /people/:personId` | `UPDATE:PERSON` |

**Sem `DELETE`** — nem a capability existe. Pessoa é referenciada por matrícula, consentimento
e autoria de postagem; apagar levaria o histórico junto.

- **CPF validado por dígito verificador** ([shared/utils/cpf](src/shared/utils/cpf/index.ts)),
  aceito com ou sem máscara e gravado só com dígitos. A validação não é capricho: o CPF é o
  que faz o `uq_pessoa_cpf` proteger, e um dígito trocado passa pelo índice e cria a segunda
  Ana do mesmo jeito.
- **O 409 devolve o `personId` de quem já tem o CPF.** Dizer só "já existe" deixaria o
  operador procurando — que é exatamente o atrito que empurra para o "cadastro de novo".
- **`?role=none`** encontra as pessoas que ficaram sem papel: é a varredura da linha órfã que
  o fluxo de duas etapas admite deixar para trás.
- **O nome é normalizado na entrada** (`formatPersonName` no schema), então o `PATCH` faz
  round-trip e o que sai é o que está gravado.
- **`PESSOA_NO_ESCOPO`** ([sql/pessoa-escopo.ts](src/modules/infra/repositories/sql/pessoa-escopo.ts))
  recorta a listagem para quem não tem `ESCOLA`. Hoje só a coordenação recebe `VIEW:PERSON`, e
  com `ESCOLA` — então o recorte não tem consumidor. Ele existe assim mesmo porque a
  alternativa não é "sem filtro por ora": é a escola inteira vazando no instante em que a
  Fase 3b conceder `VIEW:PERSON` com `TURMA`.
- **O CPF sai inteiro no payload.** Mascarar inviabilizaria a única coisa que a busca serve
  para fazer — confirmar que esta Ana é aquela Ana. Quem enxerga já precisou de
  `VIEW:PERSON`, que é capability de secretaria.

### 3.3 — `usuario` ✅

| Rota                    | Feature       |
| ----------------------- | ------------- |
| `GET /users`            | `VIEW:USER`   |
| `GET /users/:userId`    | `VIEW:USER`   |
| `POST /users`           | `CREATE:USER` |
| `PATCH /users/:userId`  | `UPDATE:USER` |
| `DELETE /users/:userId` | `DELETE:USER` |

- **A senha vem no corpo** (decisão do cliente) e só o argon2id chega ao repositório.
- **`DELETE` desativa, não apaga.** `postagem.autor_id`, `consentimento.registrado_por` e
  `acesso_turma.concedido_por` referenciam `usuario` com `ON DELETE RESTRICT`. A desativação
  encerra as sessões e revoga os tokens, que é o efeito prático de "tirar o acesso";
  `PATCH { active: true }` reativa.
- **Trocar a senha derruba a sessão aberta**, na mesma transação. Mudar a credencial e deixar
  de pé a sessão que usava a antiga não muda nada para quem já estava dentro.
- **Não dá para desativar o próprio usuário** (422): é o jeito mais fácil de o operador se
  trancar do lado de fora.
- **Dois índices únicos, dois 409 diferentes.** "Esta pessoa já tem login" e "este e-mail é de
  outra pessoa" pedem correções opostas, então o use-case consulta qual deles recusou.
- Os métodos de cadastro moram no **mesmo** `UserRepository` do login: é o mesmo agregado, como
  manda o [CLAUDE.md](CLAUDE.md) §2. O que muda é a pergunta, e por isso o read model é outro
  (`UserAccount`, ao lado de `UserCredentials` e `AuthenticatedUser`).

### 3.4 — Os papéis: `aluno`, `responsavel`, `professor` ✅

| Rota | Feature               |
| ---- | --------------------- |
| `GET | POST /students`       | `VIEW                 | CREATE:STUDENT`  |
| `GET | PATCH                 | DELETE /students/:id` | `VIEW            | UPDATE | DELETE:STUDENT` |
| `GET | POST /guardians`      | `VIEW                 | CREATE:GUARDIAN` |
| `GET | PATCH /guardians/:id` | `VIEW                 | UPDATE:GUARDIAN` |
| `GET | POST /teachers`       | `VIEW                 | CREATE:TEACHER`  |
| `GET | PATCH /teachers/:id`  | `VIEW                 | UPDATE:TEACHER`  |

Cada `POST` recebe **só** `personId` mais o que é do papel. Nome, CPF e contato são da pessoa
e mudam por `PATCH /people/:personId` — o papel não duplica o cadastro.

- **CPF obrigatório em `POST /guardians` e `POST /teachers`**
  ([assert-person-has-cpf.ts](src/modules/application/use-cases/people/assert-person-has-cpf.ts)),
  **não** em `POST /students`: criança sem CPF é a regra, e a duplicata de aluno já é barrada
  pelo `UNIQUE` de `pessoa_id`. A exigência vive onde a duplicata custa caro.
- **O recorte de `GET /students` é `alunoVisivelParaAtor`** — o mesmo da postagem individual, e
  pelo mesmo motivo: o responsável alcança a criança **pelo vínculo com ela**, a equipe **pela
  turma onde ela está matriculada**. Um ramo único por turma faria o pai de uma criança listar
  as outras da sala.
- **O responsável entra no escopo pela criança** (um salto além de `alunoVisivelParaAtor`) e o
  **professor pela turma** (`TURMA_NO_ESCOPO`, as três origens — saber o nome de quem cuida do
  filho é o que o responsável precisa e não expõe criança nenhuma).
- **`DELETE /students/:id` só desfaz o erro recém-cometido**: criança com matrícula, vínculo ou
  citação em postagem devolve 409 e sai por `PATCH { active: false }`. Responsável e professor
  não têm `DELETE` nem capability para ela.

**Verificação executada** contra `localhost:3003`, com as sete personas. O caso que o cliente
descreveu, ponta a ponta: cadastrar a Ana uma segunda vez devolve **409** com o `personId` dela;
dar-lhe `POST /guardians` com aquele id devolve **201**; e a busca passa a mostrar a mesma
pessoa com `{teacher: true, guardian: true}` — uma linha em `professor` e uma em `responsavel`.

Recorte de `GET /students`, que é a prova da propriedade central do projeto:

| Ator      | Vínculo                   | Vê                  |
| --------- | ------------------------- | ------------------- |
| `admin`   | abrangência ESCOLA        | Théo, Lívia, Helena |
| `diana`   | `VIEW:STUDENT` com ESCOLA | Théo, Lívia, Helena |
| `ana`     | `PROFESSOR_TURMA` (A)     | Théo, Helena        |
| `bruno`   | pai do Théo (turma A)     | **só Théo**         |
| `gabriel` | pai da Helena (turma A)   | **só Helena**       |
| `carla`   | mãe da Lívia (turma B)    | só Lívia            |
| `elias`   | nenhum                    | nada                |
| `fabio`   | sem perfil                | 403                 |

`bruno` e `gabriel` são pais de crianças da **mesma turma** e não enxergam o filho um do outro.

### 3.5 — Matrícula e vínculos ✅

| Rota                                      | Feature                          |
| ----------------------------------------- | -------------------------------- |
| `GET \| POST /enrollments`                | `VIEW \| CREATE:ENROLLMENT`      |
| `DELETE /enrollments/:enrollmentId`       | `REVOKE:ENROLLMENT`              |
| `GET \| POST /guardian-links`             | `VIEW \| CREATE:GUARDIAN_LINK`   |
| `PATCH \| DELETE /guardian-links/:linkId` | `UPDATE \| REVOKE:GUARDIAN_LINK` |
| `GET \| POST /teacher-links`              | `VIEW \| CREATE:TEACHER_LINK`    |
| `DELETE /teacher-links/:linkId`           | `REVOKE:TEACHER_LINK`            |
| `GET \| POST /class-accesses`             | `VIEW \| CREATE:CLASS_ACCESS`    |
| `DELETE /class-accesses/:accessId`        | `REVOKE:CLASS_ACCESS`            |

**O `DELETE` encerra, não apaga** — por isso a capability é `REVOKE`. A matrícula passada
explica a presença da criança no feed do ano anterior; o vínculo de responsável encerrado
ainda sustenta o consentimento que ele assinou; o acesso a turma encerrado é a trilha de
auditoria de quem viu o quê e a mando de quem.

- **Os índices únicos são PARCIAIS** (`WHERE data_fim IS NULL`): rematricular numa turma de
  onde o aluno saiu é legítimo e passa; vínculo **vigente** duplicado é 409.
- **`concedido_por` sai do ator**, nunca do corpo — em `class-accesses` e em `role-grants`.
  Mandar `grantedBy` no corpo é `400 unrecognized_keys`.
- **`canConsent` nasce `false`.** Assinar consentimento de LGPD por uma criança não é
  consequência automática de ser responsável por ela; é decisão explícita, por `PATCH`.
- Cada `POST` confere os dois lados do vínculo antes de inserir, para que o recordset vazio
  do `ON CONFLICT DO NOTHING` tenha uma causa só: a duplicata vigente.

#### Defeito encontrado e corrigido: `data_fim` inclusiva

Revogar devolvia **204 e não revogava nada até a virada do dia**. `ACTIVE_PERIOD` lia
`data_fim >= CURRENT_DATE`, e a revogação grava `CURRENT_DATE` — então
`DELETE /guardian-links/:linkId` respondia 204 enquanto o responsável continuava enxergando a
criança. Num projeto cujo tema é controle de acesso, isso é o defeito, não um detalhe.

E as duas grafias da regra já discordavam: as views da RLS (002 e 005) tratavam qualquer
`data_fim` preenchida como encerramento imediato, o que errava do outro lado — registrar
"esta professora sai em dezembro" tirava a turma dela **hoje**.

A [migration 006](db/migrations/006_vigencia_exclusiva.sql) fixa a leitura **exclusiva**
(`data_fim IS NULL OR data_fim > CURRENT_DATE`) nas views, e
[sql/vigencia.ts](src/modules/infra/repositories/sql/vigencia.ts) passa a ser a **única**
grafia na aplicação — `turma-escopo.ts` a reexporta, `actor.repository.ts` perdeu a cópia
local e `user.repository.ts` deixou de escrever a regra à mão. `data_fim` é o **primeiro dia
em que o vínculo já não vale**; revogar hoje vale hoje, agendar para dezembro vale até lá.

Verificado: vincular Elias ao Théo (0 → 1 aluno visível), revogar, e a listagem volta a 0 na
requisição seguinte. E a matriz de audiência da Fase 2 permanece intacta — admin 5, ana 4,
diana 4, bruno 4, gabriel 2, carla 3, elias 0, fabio 403.

### 3.6 — `perfil` e `usuario_perfil` ✅

| Rota                           | Feature                     |
| ------------------------------ | --------------------------- |
| `GET \| POST /roles`           | `VIEW \| CREATE:ROLE`       |
| `GET \| PATCH /roles/:roleId`  | `VIEW \| UPDATE:ROLE`       |
| `GET \| POST /role-grants`     | `VIEW \| CREATE:ROLE_GRANT` |
| `DELETE /role-grants/:grantId` | `REVOKE:ROLE_GRANT`         |

Esta é a rota que **fabrica permissão**, e por isso carrega guardas que nenhuma outra tem:

- **`assertNoEscalation`**
  ([assert-no-escalation.ts](src/modules/application/use-cases/roles/assert-no-escalation.ts)):
  ninguém concede capability que o próprio ator não tem, e a abrangência entra na conta —
  quem tem `VIEW:POST` só em `TURMA` não pode conceder em `ESCOLA`; o contrário é permitido.
  Sem isso, `CREATE:ROLE` era equivalente a ser administrador: bastava montar um perfil com as
  69 capabilities e conceder a si mesmo. Vale nas **duas** rotas — em `role-grants` também,
  senão bastaria se dar o `ADMINISTRADOR` que já existe.
- **Perfil de sistema não é editável pela API** (403). Ele vem de migration e é a base do
  modelo de autorização. `POST /roles` grava `sistema = false` sempre; o campo não existe no
  corpo.
- **`permissions` no `PATCH` substitui o conjunto inteiro.** Não existe "acrescentar uma" —
  sem a substituição não haveria como remover permissão de um perfil.
- **`code` não é alterável**: é a chave pela qual o resto do sistema fala do perfil.
- **Não é possível revogar o próprio perfil** (422) — diferente da desativação de usuário,
  aqui não há ninguém para reabrir se o ator era o único.
- A capability é validada **duas vezes**: contra o enum `Feature` no schema (400) e contra a
  tabela `PERMISSAO` no repositório. As duas listas podem divergir, e é essa deriva que o
  `assertFeaturesInSync` vigia no boot.

**Verificação da escalada**, executada com o Fábio (usuário sem perfil no seed): concedido a
ele um perfil com `CREATE:ROLE` e `CREATE:ROLE_GRANT` e mais nada, ele recebe **403** ao tentar
criar um perfil com `DELETE:POST` — com a capability excedente nomeada no `cause` —, **403** ao
tentar conceder a si mesmo o `ADMINISTRADOR`, e **201** ao criar um perfil apenas com o
`VIEW:PERSON` que ele de fato tem.

## Fase 3b — Catálogo de perfis de sistema ✅

A dívida que a 0.7 deixou aberta, quitada pela
[migration 007](db/migrations/007_perfis_de_sistema.sql). Até aqui o banco tinha **um** perfil,
o `ADMINISTRADOR` da `004`, que recebe as 69 capabilities em `ESCOLA` e por construção
**contorna** o isolamento por turma. Todo o resto do modelo — as três abrangências, o recorte
por turma, a guarda de escalada — não tinha um perfil real que o exercitasse.

**Uma cópia por escola, e não um catálogo global.** A `001` reservava `escola_id NULL` para o
perfil de sistema (é o motivo do `NULLS NOT DISTINCT` em `uq_perfil_codigo`). A decisão foi a
outra: cada escola recebe a sua cópia, com `escola_id` preenchido. O motivo é a Fase 6 — as
políticas de RLS são todas ancoradas em `escola_id`, e uma linha que não pertence a escola
nenhuma vira caso especial em cada política. Cópia por escola mantém o modelo uniforme: toda
linha tem dono. `escola_id NULL` fica sem uso, e o índice continua correto.

As quatro são `sistema = true` — provisionadas por migration e **não editáveis pela API**, que
é o que faz `PROFESSOR` significar a mesma coisa em toda escola. A escola que precisar de
outra combinação cria um perfil próprio pelo `POST /roles`, já sujeito ao
`assert-no-escalation`.

| Perfil          | Concessões | Regra                                                    |
| --------------- | ---------- | -------------------------------------------------------- |
| `ADMINISTRADOR` | 69         | tudo em `ESCOLA` — não use para demonstrar o isolamento  |
| `COORDENACAO`   | 61         | conteúdo em `TURMA`; cadastro e acessos em `ESCOLA`      |
| `PROFESSOR`     | 25         | `TURMA` em tudo, sem uma linha `ESCOLA` fora do catálogo |
| `RESPONSAVEL`   | 15         | lê a turma do filho, comenta, reage e consente           |

O `RESPONSAVEL` **não tem `CREATE:POST`**, e isso é decisão de produto: a ferramenta é de
comunicação da escola para a família, e a família responde por comentário. O que a
`COORDENACAO` não recebe, também de propósito: `CREATE:ROLE` e `UPDATE:ROLE` (desenhar perfil
é configurar o próprio modelo de autorização), `UPDATE:SCHOOL`, `DELETE:USER` e
`DELETE:STUDENT` — criança que sai da escola é `REVOKE:ENROLLMENT`, não exclusão de gente.

A migration é **idempotente e autoritativa**: o `DO UPDATE` adota perfil que já exista com o
mesmo código — foi assim que os perfis comuns do `demo.sql` viraram os de sistema sem refazer
uma linha de `usuario_perfil` — e o `DELETE` final remove concessão que tenha saído do
catálogo. O `demo.sql` deixou de criar perfil: agora só distribui, e busca o `perfil_id` pelo
código, porque o id passou a ser gerado pela migration.

**Verificado.** As duas matrizes da Fase 2 e da Fase 3 reproduzem intactas — postagens
`admin 5 / ana 4 / diana 4 / bruno 4 / gabriel 2 / carla 3 / elias 0 / fabio 403`, alunos
`admin 3 / diana 3 / ana 2 / bruno 1 / gabriel 1 / carla 1 / elias 0 / fabio 403`. A
`COORDENACAO` (diana) passou a criar pessoa, ano letivo e turma (**201**), e continua barrada
em `POST /roles` (**403**); o `PATCH` num perfil de sistema dá **403** mesmo para o
administrador; a `PROFESSOR` (ana) segue com **403** em todo cadastro; e diana concede
`COORDENACAO` (**201**) mas não `ADMINISTRADOR` (**403**, pelo `assert-no-escalation`). O
caminho de banco novo foi testado num banco descartável: as sete migrations mais o seed
produzem exatamente o mesmo estado do banco que já existia.

**TODO(escola):** quando `POST /schools` existir, o cadastro de escola tem de replicar este
catálogo para a escola nova.

## Fase 4 — Conteúdo e interação

### 4.0 — Armazenamento de imagem e foto de perfil ✅

**A árvore de pastas**, decidida com o cliente:

```
public/imagens/postagens/   imagens das postagens (4.1)
public/imagens/pessoas/     foto de perfil        (feita)
```

O conteúdo não é versionado — só a estrutura, pelos `.gitkeep`. O `STORAGE_ROOT` passou de
`./uploads` para `./public/imagens`, e o `folder` que o `LocalFileStorage.save` já recebia
vira o nome da subpasta.

**A pasta se chama `public`, mas não é servida estaticamente.** Decisão explícita: um
`express.static` deixaria a foto de qualquer criança acessível a quem receber o link, sem
sessão e para sempre — o oposto da tese. As imagens saem por rota autenticada
(`GET /people/:personId/photo`), que aplica o mesmo recorte de audiência do resto do sistema.
O nome do arquivo carrega o hash do conteúdo, mas isso é deduplicação, não segurança: o gate
é a sessão.

**A foto é da PESSOA, não do USUÁRIO.** O rosto é da pessoa, não da credencial — conta
desativada e recriada continua sendo a mesma pessoa —, e criança é `PESSOA` sem `USUARIO`:
pendurar no login deixaria de fora justamente quem mais aparece em foto numa escola infantil.
A coluna `pessoa.foto_chave` guarda o caminho relativo à raiz do storage, nunca a URL, porque
host e prefixo mudam entre ambientes e o `TODO(cdn)` vai trocar a base sem tocar no banco.

**Duas capabilities novas** ([migration 008](db/migrations/008_foto_de_perfil.sql)), separadas
de `PERSON` porque a régua é outra — **todo usuário troca a própria foto**, inclusive o
responsável, que não tem nem deve ter permissão de editar cadastro:

| Capability     | `RESPONSAVEL` | `PROFESSOR` | `COORDENACAO` | `ADMINISTRADOR` |
| -------------- | ------------- | ----------- | ------------- | --------------- |
| `VIEW:PHOTO`   | `TURMA`       | `TURMA`     | `ESCOLA`      | `ESCOLA`        |
| `UPDATE:PHOTO` | `PROPRIA`     | `PROPRIA`   | `ESCOLA`      | `ESCOLA`        |

`PROPRIA` compara `pessoa.id`, e o `actor.id` é `usuario.id` — chaves diferentes. O salto é
feito no SQL, por [`sql/pessoa-do-ator.ts`](src/modules/infra/repositories/sql/pessoa-do-ator.ts),
irmão do `escola-do-ator`. Carregar o `pessoa_id` no `Actor` resolveria também, ao custo de
engordar a credencial com cadastro.

**Três rotas:** `GET`, `PUT` e `DELETE` em `/people/:personId/photo` — 61 → 64. A imagem sobe
como `multipart/form-data` no campo `file`.

Dois defeitos achados testando, ambos corrigidos:

- **Erro de multer virava 500.** O multer não lança: entrega o `MulterError` ao `next`, e o
  handler global — que só conhece `AppError` — embrulhava em 500 o que é erro do cliente.
  Arquivo de 11 MB e campo com nome errado respondiam "erro interno". O wrapper `singleFile`
  traduz: **413** (`PayloadTooLargeError`, classe nova) e **400**.
- **O `mimetype` do multer não prova nada.** Vem do cabeçalho do próprio cliente, então um
  `.txt` renomeado chegava anunciado como `image/jpeg` — e a foto é devolvida com um
  `Content-Type` que o navegador obedece. `sniffImageMime` lê a assinatura real dos bytes.
  Só JPEG, PNG e WebP; SVG fica fora por ser documento com script dentro.

**Verificado.** Bruno (`RESPONSAVEL`) troca a própria foto (**200**) e não a da Carla
(**404** — não 403, para não confirmar que a pessoa existe); diana (`COORDENACAO`) troca a de
qualquer um, inclusive a do Théo, que não tem login. No `VIEW:PHOTO`: bruno vê o filho, ana
vê pela turma, gabriel vê o colega de turma do filho, **elias não vê ninguém** (**404**),
fabio leva **403** e sem sessão é **401**. Arquivo que não é imagem dá **422**. As matrizes
da Fase 2 e da Fase 3 seguem intactas.

### 4.1 a 4.3 — o que falta

`midia` (upload multipart em `public/imagens/postagens/`, mesma tubulação da foto),
`postagem_comentario` (remoção lógica, com motivo obrigatório na moderação da escola),
`postagem_reacao` (trocar de reação é `UPDATE`, não linha nova). O `TODO(midia)` do
`publish-post` relaxa para `hasBody || temMidia` quando a 4.1 existir.

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
  precisam concordar. **Mitigado** — `assertFeaturesInSync` roda no boot, depois das
  migrations, e lança se houver divergência nos dois sentidos. Código no enum e não na tabela
  é o caso perigoso: `canRequest` compara contra o que veio do banco, então ninguém jamais
  teria aquela capability e toda requisição à rota seria negada sem nada acusar o motivo.
  Verificado injetando uma linha fantasma em `PERMISSAO` — o boot recusa e nomeia o código.
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
