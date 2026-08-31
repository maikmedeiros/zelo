# Convenções e armadilhas — Zelo API

Node.js (ESM) + Express 5 + **TypeScript 6** (`module: NodeNext`), Clean Architecture / DDD,
Zod 4, PostgreSQL via `pg` **sem ORM**. **Um único módulo de domínio: `zelo`.**

Cada item aqui existe porque a alternativa deu problema. Leia antes de escrever código.

---

## 1. Princípios

1. **Dependência aponta para dentro.** `presentation` → `application` → `domain`; `infra`
   implementa contratos de `domain`. O `domain` **não importa nada de fora dele**.
2. **`infra` é a única camada que conhece o banco.** Nenhum `pg` fora de
   `shared/infra/database/` e `modules/infra/repositories/`.
3. **Let it throw.** Ninguém captura erro no caminho da requisição. Regras de negócio
   **lançam**; o error handler global (último middleware) serializa. No Express 5 a rejeição
   de handler async é encaminhada sozinha.
4. **DI manual por factory.** Sem container: `new Repo(db) → new UseCase(repo) → new
Controller(uc)` dentro de `main/factories/`. O repositório **recebe** o provider por
   constructor; **nunca** importa o singleton `db`.
5. **Um arquivo por agregado no `infra`.** Repositório é por conceito
   (`PostagemRepository`), nunca um god-repo por domínio.
6. **Envelope de coleção mora na apresentação.** O use-case entrega **dado** (`items` +
   `pagination`); quem monta `{ results, page, limit, … }` é o controller, via presenter.
7. **Paginação vem pronta do banco.** A query paginada projeta `PAGINA_ATUAL`,
   `LIMITE_PAGINA`, `TOTAL_REGISTRO`, `TOTAL_PAGINA`. **Ninguém computa `totalPages` na
   aplicação.**
8. **Config valida no boot.** `process.env` passa por um schema Zod; variável faltando ou
   inválida **lança no boot**. Nada de `undefined` silencioso em runtime.
9. **Nada de string mágica de permissão.** As capabilities são o enum `Feature`.
10. **Não antecipe abstração.** Tipo/base compartilhado nasce quando aparece o **primeiro
    consumidor real**.

---

## 2. Onde cada arquivo mora

- **`domain/` é FLAT.** Entities e interfaces de repositório são compartilhadas entre
  features, não dependem da URL. Uma entity por conceito; read models distintos por caso de
  uso quando o formato difere (`Post` para a lista, `PostDetail` para o detalhe) — e cuidado
  com **colisão de nomes** entre eles.
- **`application/` e `presentation/` são agrupados por RECURSO, espelhando a URL.** Cada
  segmento de recurso vira uma pasta e a **feature fica na ponta**. **Params (`:id`) não
  viram pasta.**
  - `GET /posts` → `.../posts/find-list-posts/`
  - `GET /posts/:postId` → `.../posts/find-post-by-id/`
  - `POST /posts/:postId/comments` → `.../posts/comments/create-comment/`
- **Rota pública mora em `main/routes/public/`**, montada antes do `injectActor` (§9).
- **`infra/repositories/` é 1 arquivo por agregado**, opcionalmente agrupado em pasta por
  subdomínio. Vários métodos no mesmo repo é OK **se servem o mesmo agregado**.
- **`main/routes/` e `main/factories/` NÃO têm o segmento do módulo** — só existe um módulo.

## 3. Nomenclatura de features (obrigatória)

**O código é em INGLÊS — URL, pasta, feature, símbolo, entity, repositório.** O que continua
em português é o **banco**: nome de tabela, de coluna e o alias `UPPER_SNAKE` dos
`*PersistenceRow`, porque espelham o modelo (`zelo_v2.dbml`). A costura é o repositório: SQL
em português entrando, tipos em inglês saindo.

| Operação           | Padrão                     | Exemplo                         |
| ------------------ | -------------------------- | ------------------------------- |
| Leitura de coleção | `find-list-<resource>`     | `find-list-posts`               |
| Leitura de item    | `find-<resource>-by-<key>` | `find-post-by-id`               |
| Escrita            | `<verb>-<resource>`        | `create-post`, `revoke-consent` |

**Nunca `get-` nem `list-`.** Os símbolos seguem a feature: `find-list-posts` →
`FindListPostsUseCase`, `FindListPostsController`, `findListPostsValidator`,
`makeFindListPostsController`.

Exceção registrada: `GET /sessions/current` usa `find-current-session`, porque `current` é
seletor e não campo — `find-session-by-current` não diz nada.

**Contratos de `domain`/`infra` NÃO seguem a feature** (são compartilhados): o método do
repositório é `list()` / `findById()`, os tipos são `ListPostsFilters` / `ListPostsResult`, e
entity / mapper / `*PersistenceRow` mantêm o nome do conceito.

---

## 4. ESM / TypeScript

- **Todo import relativo termina em `.js`**, mesmo apontando para um `.ts`. Exigência do
  `NodeNext`.
- **Cross-cutting usa alias** (`@shared/*`, `@config/*`, `@main/*`, `@modules/*`); **dentro
  do módulo**, caminho relativo. O `tsc-alias` reescreve os aliases no build.
- **Build = typecheck** (`noEmitOnError`). É o gate de correção enquanto não houver testes.
- Pacote CJS com `.d.ts` em estilo ESM (caso do `pino-http`) pode não expor `default` sob
  `NodeNext` — use o **named export** (`import { pinoHttp } from 'pino-http'`).
- **`paths` sem `baseUrl`.** No TS 6 os caminhos são resolvidos relativos ao próprio
  `tsconfig.json`. `baseUrl` é legado e não sobrevive ao caminho do TS 7 (compilador
  nativo) — não reintroduza.

## 5. Express 5

- **`req.query` é getter sem setter.** O validator de query faz `safeParse` **sem
  reatribuir**; o controller **re-parseia** `httpRequest.query` com o mesmo schema. Body
  pode ser reatribuído.
- **Rejeição async vai sozinha ao error handler** — é o que sustenta o "let it throw". Não
  existe `express-async-errors` nem wrapper de try/catch.
- **Ordem de rotas:** estática antes de param (`/postagens/resumo` antes de
  `/postagens/:postagemId`).
- **A ordem dos middlewares em `main/app.ts` é significativa** e não está comentada no
  arquivo: os body parsers vêm antes do logger de request/response (que precisa de
  `req.body`), e as rotas públicas antes do `injectActor`. Ver §9.

## 6. Erros — let it throw

- Validação Zod → **400** com as `issues` no `cause`.
- Regra de negócio **lança** a classe adequada (`@shared/errors`). **Nada captura no
  caminho** — nem o controller, nem o adapter.
- O handler global serializa `AppError` com o próprio `statusCode`, embrulha o resto em
  `InternalServerError` (500) e loga tudo. `stack` só fora de produção; `cause` em produção
  apenas para `ValidationError` (ali é o relatório dos erros do próprio cliente).
- **O handler não tem efeito colateral**: não mexe em cookie/sessão. Um 401 não prova sessão
  inválida — quem limpa o cookie é o `injectActor`, que sabe por que falhou.

| Classe                     | Status |
| -------------------------- | ------ |
| `ValidationError`          | 400    |
| `UnauthorizedError`        | 401    |
| `ForbiddenError`           | 403    |
| `NotFoundError`            | 404    |
| `MethodNotAllowedError`    | 405    |
| `ConflictError`            | 409    |
| `PayloadTooLargeError`     | 413    |
| `UnprocessableEntityError` | 422    |
| `ServiceError`             | 502    |
| `InternalServerError`      | 500    |

Única exceção documentada ao "let it throw": `StatusRepository.checkDatabase()` captura, de
propósito — banco fora é o **resultado** da rota de status (503 degradado), não uma falha
dela.

## 7. Banco

- Repositório acessa o banco **só** via `this.db.query(...)`, com o provider **injetado por
  constructor**.
- **Parâmetros sempre nomeados** (`@nome` no SQL + objeto `variables`). O provider traduz
  para `$1`/`$2`. **Nunca concatene valor em string SQL** — é o que mantém o
  `p/sql-injection` do Semgrep limpo.
- **`*PersistenceRow` em UPPER_SNAKE** é o contrato da linha. Como o PostgreSQL dobra
  identificador não-citado para caixa baixa, o alias vem **entre aspas duplas**
  (`AS "ID_POSTAGEM"`). Não "melhore" esses nomes fora do mapper.
- **Ausência → `null` explícito**, nunca `undefined`: o driver trataria `undefined` como
  parâmetro faltando.
- **Paginação vem do banco** (`count(*) OVER ()` na CTE filtrada). Ninguém computa
  `totalPages`.
- **Transação usa UMA conexão** → as queries dentro do `work` têm de ser **sequenciais**;
  duas em paralelo se atropelam no mesmo client.
- Para saber se um `UPDATE`/`DELETE` afetou linha, use **`RETURNING`**: recordset vazio ⇒ o
  repositório devolve `null`/`false` e o **use-case** traduz em `NotFoundError`.
- **Upload passa pelo `singleFile`, não pelo `upload.single` cru.** O multer não lança: ele
  entrega o `MulterError` ao `next`, e o handler global embrulharia em 500 o que é erro do
  cliente. O wrapper em `shared/middlewares/upload.ts` traduz — arquivo grande demais vira
  **413**, campo errado vira **400**. Ele entra **entre** o `canRequest` e o validator.
- **Imagem é conferida pelos bytes, não pelo `mimetype`.** O `mimetype` do multer vem do
  cabeçalho do cliente; `sniffImageMime` lê a assinatura real. Só JPEG, PNG e WebP — SVG é
  documento com script dentro.
- **I/O de arquivo fica FORA da transação.** Escrita em disco não faz rollback, e manter o
  upload dentro do `BEGIN` prenderia a conexão. Arquivo órfão é inofensivo: o nome carrega o
  hash do conteúdo, então um reenvio reaproveita o mesmo arquivo.

## 8. Validação de entrada

- **Corpo de escrita (`POST`/`PUT`/`PATCH`) usa `z.strictObject`** — inclusive objetos
  aninhados. O default do Zod (`strip`) **descarta chave desconhecida em silêncio**: um typo
  (`alunoId` em vez de `alunoIds`) sumiria sem erro, o campo cairia no `.default([])` e a
  escrita ficaria silenciosamente incompleta. `strictObject` transforma isso em **400
  `unrecognized_keys`**. `.default(...)` continua funcionando quando o campo é **omitido** —
  strict só barra chave **desconhecida**.
- **Query e params usam `z.object`** (lenientes): a query string acumula lixo incidental
  (`utm_*`, cache-buster) que não deve virar 400, e params vêm da própria URL.
- Sempre **`safeParse`**, nunca `.parse` no validator. Em falha,
  **`throw new ValidationError({ cause: result.error.issues })`** — nada de `res.status(400)`.
- Regras completas em
  [`src/modules/presentation/validators/CLAUDE.md`](src/modules/presentation/validators/CLAUDE.md).

## 9. Autorização

- `injectActor` é **global** → toda rota nasce privada. Rota pública mora em
  `main/routes/public/`, que o loader monta **antes** dessa linha. A pasta é a declaração:
  não existe sinalizador nem lista. A granularidade é o **arquivo**, então login (público) e
  logout (privado) ficam em arquivos separados, apesar de serem o mesmo recurso.
- Arquivo em `public/` **não pode usar `canRequest`** — sem ator no contexto ele lança 500,
  de propósito, acusando a inversão.
- **Por rota:** `authz.canRequest(Feature.X)` como **primeiro middleware** → 403 sem a
  capability. Recebe a capability **crua** (`ACAO:RECURSO`), sem abrangência.
- **Por recurso:** a abrangência `PROPRIA`/`TURMA`/`ESCOLA` é resolvida **no controller**, de
  duas formas:
  - filtrar a consulta quando o ator não tem `ESCOLA`
    (`authz.scopesOf(actor, Feature.X).includes('ESCOLA') ? undefined : actor.id`);
  - checar o dono do recurso já carregado com `authz.can(actor, Feature.X, { ownerId, groupId })`
    — o use-case recebe o guard por **callback**, mantendo o `authz` fora da aplicação.
- `groupId` é a **turma**. O ator carrega `groups` com as turmas resolvidas pelas três
  origens do modelo: filho matriculado, `PROFESSOR_TURMA` e `ACESSO_TURMA`.
- Regras do enum em [`src/config/CLAUDE.md`](src/config/CLAUDE.md).

## 10. Autoria e identidade

- **Grave sempre o `actor.id`, nunca o `name`.** O `id` é `usuario.id`, o identificador
  **estável**; `name` é rótulo de exibição. O modelo v2 não tem `handle`.
- A abrangência `PROPRIA` compara `ownerId` contra `actor.id` — o mesmo `id` serve de autoria
  (`postagem.autor_id`, `consentimento.registrado_por`) e de chave de dono.
- Token de API autentica **como** o usuário dono: mesmo `id`, mesmas permissões. Só o
  `actor.kind` muda.

## 11. Comentários

**Só `TODO` e `FIXME`. Nada mais.** Decisão de 31/08/2026, e ela vale para todo arquivo
criado ou editado a partir dali.

O rationale de uma decisão vai para o **corpo do commit** ou para o `PLANO.md` — lugares onde
ele é versionado sem poluir a leitura do código e sem apodrecer junto com a linha que
comentava. O que explica o código é o próprio código: nome, tipo, extração de função.

- **`// TODO(escopo)` é convenção do projeto** — em uso: `TODO(cdn)`, `TODO(rls)`,
  `TODO(html)`, `TODO(ci)`, `TODO(doc)`. Marca o ponto exato de troca.
- **`// FIXME(escopo)`** para defeito conhecido que ainda não foi corrigido.
- Nada de código morto comentado, **não assine o código**.
- Régua: um arquivo novo tende a **zero** comentários.

Os comentários de "porquê" que já existem no código são anteriores a esta decisão e **ficam
onde estão** — não há campanha de remoção. Ao editar um arquivo que os tem, não crie novos.

---

## 12. Checklist para criar uma rota

Antes de codar, tenha respondido: **método e caminho** (sem o prefixo `/v1`, aplicado pelo
loader); **entrada** (query/body/params, com obrigatoriedade, tipo e regras); **formato exato
do retorno** (status + JSON); **SQL** (ou a decisão explícita de mockar, com `// TODO(db)`);
**capability**.

Ordem de criação (cada arquivo depende do anterior):

```
 1. config/features.ts              → a capability (+ linha em PERMISSAO e concessão em
                                      PERFIL_PERMISSAO, numa migration nova)
 2. domain/entities/                → a entity (reuse se já existir)
 3. domain/repositories/            → o método na interface do agregado
 4. application/dtos/…/input.ts     → schema Zod (strictObject se for corpo de escrita)
 5. application/dtos/…/output.ts    → tipo de saída
 6. application/mappers/…           → *PersistenceRow + fromPersistence/toOutput
 7. application/use-cases/…         → orquestração (lança erro de negócio)
 8. infra/repositories/…            → SQL + params nomeados
 9. presentation/validators/…       → safeParse + throw ValidationError (+ index.ts)
10. presentation/controllers/…      → { statusCode, body } (+ envelope, + escopo)
11. main/factories/…                → DI manual (+ index.ts)
12. main/routes/<recurso>.routes.ts → canRequest → validator → controller
```

Verificação:

```bash
npm run build   # noEmitOnError → build == typecheck
npm run dev
```

Depois exercite os casos de erro: **400** (validação), **401** (sem credencial — o
`injectActor` é global, isso é esperado), **403** (sem capability), **404** (não encontrado).

**Recurso já existe?** Não recrie: adicione a rota ao arquivo existente, o método à interface

- implementação do repositório e o `make*Controller` ao `index.ts`, reaproveitando entity e
  mapper.
