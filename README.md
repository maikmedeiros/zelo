# Zelo — API

API REST da plataforma de comunicação escola-família para educação infantil, com feed
segmentado por turma e gestão granular de consentimento de uso de imagem.

**Node.js (ESM) + Express 5 + TypeScript 6**, em Clean Architecture / DDD, validação com
**Zod 4** e **PostgreSQL** via `pg` **sem ORM** (SQL cru escrito à mão nos repositórios).

- **MongoDB** entra apenas como destino **opcional** do log de request/response. Nenhum
  dado de domínio mora lá.
- Toda rota é servida sob o prefixo **`/v1`**, aplicado por um loader central.
- **Não há suíte de testes**: o gate de correção é `npm run build` — o `tsc` roda com
  `noEmitOnError`, então **build = typecheck**.

---

## Como rodar

```bash
nvm use                 # lê o .nvmrc (Node 24)
npm ci
cp .env.example .env.development   # e preencha (o .env só define NODE_ENV)
npm run db:up                      # sobe o PostgreSQL e aplica as migrations
npm run dev                        # sobe na porta do .env.<NODE_ENV>
```

Verificação:

```bash
curl -i http://localhost:3000/v1/status   # 401 sem credencial — é o esperado
curl -s http://localhost:3000/metrics     # público (registrado antes do injectActor)
```

> **`401` sem credencial não é bug.** O `injectActor` é **global**: toda rota é privada.
> Teste com o cookie de sessão ou com o header `x-api-key`.

### Scripts

| Comando                     | O que faz                                                |
| --------------------------- | -------------------------------------------------------- |
| `npm run dev`               | `tsx watch` no entrypoint                                |
| `npm run dev:sql`           | idem, com o log de sentenças SQL ligado                  |
| `npm run build`             | `tsc` + `tsc-alias`. **É o gate de correção**            |
| `npm start`                 | roda o compilado (`dist/main/start.js`)                  |
| `npm run lint:eslint:fix`   | ESLint com `--fix`                                       |
| `npm run lint:prettier:fix` | Prettier com `--write`                                   |
| `npm run lint:security`     | SAST camada 1 (`eslint-plugin-security`, config isolada) |
| `npm run scan:semgrep`      | SAST camada 2, **diff** vs `origin/main`                 |
| `npm run security:all`      | lint de segurança + semgrep full + `npm audit`           |

> **Armadilha do `dev:sql`:** `config/env.ts` carrega `.env` e depois `.env.<NODE_ENV>` com
> `override: true`. Declarar `SQL_LOG_STATEMENTS` no `.env.development` **sobrescreveria** o
> valor passado na linha de comando — por isso a variável fica **fora** desse arquivo.

---

## Banco local com Docker

O [compose.yaml](compose.yaml) sobe **PostgreSQL** (fonte da verdade) e **MongoDB**
(destino do log de request/response) — a API continua no host com `npm run dev`, que é o
ciclo de edição mais rápido (watch do `tsx`, sem rebuild de imagem).

```bash
npm run db:up        # sobe os dois e espera os healthchecks passarem
npm run db:psql      # abre um psql no PostgreSQL
npm run db:mongo     # abre um mongosh no MongoDB
npm run db:logs      # acompanha o log do PostgreSQL
npm run db:down      # para, PRESERVANDO os dados
npm run db:reset     # APAGA os volumes e recria tudo do zero
npm run db:mongo:up  # sobe SÓ o Mongo (útil para testar a degradação da API sem ele)
```

**As migrations rodam sozinhas no primeiro `db:up`.** A imagem do Postgres executa
`/docker-entrypoint-initdb.d/*.sql` em ordem alfabética, que é exatamente a ordem numérica
de `db/migrations/` (`001` → `002` → `003`).

Três coisas que valem saber:

- **O initdb só roda com o volume vazio.** Depois do primeiro boot, uma migration nova **não**
  é aplicada por um `db:up`. Ou você recria (`npm run db:reset`, perdendo os dados), ou aplica
  só a nova à mão:
  ```bash
  docker compose --env-file .env.development exec -T postgres \
    psql -v ON_ERROR_STOP=1 -U zelo -d zelo < db/migrations/004_nova.sql
  ```
  Os scripts **não são idempotentes** — reaplicar `001` num banco já criado dá erro de objeto
  duplicado.
- **A porta é publicada só em `127.0.0.1`.** A senha de desenvolvimento é trivial; não vale
  expor na rede local.
- **O Compose interpola do `.env`**, e neste projeto o `.env` só define `NODE_ENV` — as
  credenciais estão no `.env.<NODE_ENV>`. É por isso que os scripts passam
  `--env-file .env.development`: mantém compose e aplicação com a **mesma** senha. Se rodar
  `docker compose up -d` puro, ele cai nos defaults (`zelo`/`zelo`/`zelo`).

### Log de request/response no MongoDB

Ligado pela feature flag **`MONGO_LOG_ACTIVE`** no `.env.<NODE_ENV>`. É **acessório**: nenhum
dado de domínio mora no Mongo, e a API funciona com ele desligado ou fora do ar.

| `MONGO_LOG_ACTIVE` | O que acontece                                                             |
| ------------------ | -------------------------------------------------------------------------- |
| `false`            | Nenhum socket é aberto, o middleware não é registrado. Boot em **~1s**     |
| `true`, Mongo up   | Cada requisição gera um documento na coleção `logs`                        |
| `true`, Mongo down | A API **sobe assim mesmo**, loga o erro e segue sem o log. Boot em **~4s** |

Comportamento verificado nos três casos. Três invariantes que **não** devem ser quebradas:

1. **Nunca no caminho da resposta.** A escrita acontece em `res.on('finish')` e o `insertOne`
   **não é aguardado**.
2. **Mongo fora não vira erro de request.** `getCollection()` devolve `null` e o middleware
   desiste em silêncio.
3. **Nada de dado sensível.** `redact()` mascara por nome de chave, `pickHeaders()` é
   **allowlist** (por isso `authorization` e `cookie` nunca são gravados) e `truncate()` corta
   corpo acima de `MONGO_LOG_MAX_BODY_SIZE`.

**Os índices são criados no primeiro boot do container**, por
[db/mongo-init/001_indexes.js](db/mongo-init/001_indexes.js): o **TTL** de 30 dias em
`timestamp` (a aplicação nunca remove documento — sem ele a coleção cresce até estourar o
disco) e três índices de consulta, por rota, por ator e por status.

> Em homolog/produção esse script **não roda** — o `initdb.d` é do container local. **Crie o
> índice TTL à mão antes de ligar a flag em produção.**

Duas armadilhas conhecidas:

- **A flag só muda no arquivo.** `config/env.ts` carrega `.env.<NODE_ENV>` com
  `override: true`, então `MONGO_LOG_ACTIVE=false npm run dev` **não funciona** — o valor do
  arquivo vence. Edite o `.env.<NODE_ENV>`.
- **Sem reconexão automática.** Se a API subir com o Mongo fora, ela não volta a tentar
  conectar quando o Mongo aparecer: `getCollection()` segue devolvendo `null`. Suba o Mongo
  **antes** da API, ou reinicie a API depois.

Para um banco **externo** (homolog/produção), o alvo `make migrate` aplica as migrations via
`psql` do host.

---

## Variáveis de ambiente

Todas passam por um schema Zod em `src/config/env.ts`. **Variável faltando ou inválida
lança no boot**, com a lista de problemas. Nenhum outro módulo lê `process.env`.

| Variável                  | Obrigatória         | Descrição                                                        |
| ------------------------- | ------------------- | ---------------------------------------------------------------- |
| `NODE_ENV`                | não (`development`) | `development` \| `staging` \| `production`                       |
| `PORT`                    | **sim**             | porta do servidor                                                |
| `PUBLIC_URL`              | **sim**             | base pública **já com o prefixo `/v1`** — monta as URLs de mídia |
| `ALLOW_ORIGIN_LIST`       | não (`[]`)          | allowlist de CORS, separada por vírgula                          |
| `API_KEY_PREFIX`          | **sim**             | prefixo esperado no header `x-api-key`                           |
| `SESSION_COOKIE_NAME`     | **sim**             | enum fechado: `ZELO_APP` \| `ZELO_APP_STAGING` \| `ZELO_APP_DEV` |
| `SESSION_COOKIE_DOMAIN`   | não                 | domínio compartilhado do cookie (fora de development)            |
| `PG_HOST`                 | não (`localhost`)   | host do PostgreSQL                                               |
| `PG_PORT`                 | não (`5432`)        | porta                                                            |
| `PG_USER`                 | **sim**             | usuário                                                          |
| `PG_PASSWORD`             | **sim**             | senha                                                            |
| `PG_DB_NAME`              | **sim**             | banco                                                            |
| `PG_SSL`                  | não (`false`)       | liga TLS na conexão                                              |
| `PG_POOL_MAX`             | não (`10`)          | tamanho máximo do pool                                           |
| `SQL_LOG_STATEMENTS`      | não (`false`)       | loga as sentenças SQL (só via `npm run dev:sql`)                 |
| `STORAGE_ROOT`            | não (`./uploads`)   | raiz do storage local de mídia                                   |
| `UPLOAD_MAX_FILE_SIZE`    | não (`10485760`)    | teto por arquivo, em bytes                                       |
| `MONGO_LOG_ACTIVE`        | não (`false`)       | liga o log de request/response                                   |
| `MONGO_URI`               | **se log ligado**   | URI de conexão                                                   |
| `MONGO_DB_NAME`           | **se log ligado**   | banco do log                                                     |
| `MONGO_LOG_COLLECTION`    | não (`logs`)        | coleção do log                                                   |
| `MONGO_LOG_MAX_BODY_SIZE` | não (`10240`)       | teto do corpo gravado, em bytes                                  |

`SESSION_COOKIE_NAME` é um **enum fechado** de propósito: fora de development o cookie é
escopado no domínio compartilhado, então homolog e produção dividem o mesmo `Domain` —
nomes iguais fariam uma sessão sobrescrever a outra no mesmo browser. E o valor tem de ser
**idêntico** ao das outras aplicações do ecossistema: divergência **não gera erro**, gera
**401 em loop**.

---

## Estrutura

```
src/
├── config/      # bootstrap e composição global (env, providers, authz, features, rotas)
├── shared/      # cross-cutting, agnóstico de domínio
├── modules/
│   └── zelo/    # ÚNICO módulo de domínio: domain, application, infra, presentation
└── main/        # entrypoint, app Express, factories (DI manual) e arquivos de rota

db/migrations/   # schema em SQL, aplicado em ordem numérica
```

A dependência aponta **para dentro**: `presentation` → `application` → `domain`; `infra`
implementa contratos de `domain`. O `domain` não importa nada de fora dele.

Detalhes de convenção — nomenclatura de feature, onde cada arquivo mora, as armadilhas do
Express 5 e do ESM — estão em **[CLAUDE.md](CLAUDE.md)**.

---

## Endpoints

| Método   | Caminho             | Capability             | Retorno                             |
| -------- | ------------------- | ---------------------- | ----------------------------------- |
| `GET`    | `/v1/status`        | — (só autenticação)    | `200` \| `503` degradado            |
| `GET`    | `/v1/postagens`     | `ZELO:postagem:list`   | `200` `{ results, page, limit, … }` |
| `POST`   | `/v1/postagens`     | `ZELO:postagem:create` | `201` (multipart, campo `midias`)   |
| `GET`    | `/v1/postagens/:id` | `ZELO:postagem:read`   | `200`                               |
| `DELETE` | `/v1/postagens/:id` | `ZELO:postagem:delete` | `204`                               |

### Isolamento de audiência

É o requisito de segurança mais crítico do sistema, e tem **duas camadas**:

1. **Aplicação** — a CTE `turma_visivel` em `postagem.repository.ts` é o único lugar que
   define quais turmas um `handle` enxerga (turma de filho matriculado, para responsável;
   turma atribuída, para professor). O controller decide se aplica o recorte, olhando se o
   ator tem a capability no escopo `:any`.
2. **Banco** — Row Level Security (`db/migrations/003_rls.sql`), como defesa em
   profundidade para o caso de uma query nova esquecer o filtro. Ver o `TODO(rls)` no
   arquivo: ligar exige `SET LOCAL app.actor_handle` por transação no provider.

---

## Observabilidade

- **Log de acesso** (stdout, `pino-http`): método, rota, status e duração. **Nada de
  headers ou corpo** — o `x-api-key` e o cookie chegam por header e o stdout não passa pela
  allowlist. Ignora `/metrics` e os paths excluídos.
- **Métricas** (`GET /metrics`, `prom-client`): duração por `{method, route, status_code}`.
  Registrado **antes** do `injectActor`, portanto público.
- **Log de request/response** (MongoDB, opt-in): gravado em `res.on('finish')`, fora do
  caminho da resposta, com `redact` por nome de chave, allowlist de headers e truncamento.

> **Pré-requisito de deploy do log no Mongo:** nenhum índice é criado pelo código. Antes de
> ligar em produção, crie o índice TTL —
> `db.logs.createIndex({ timestamp: 1 }, { expireAfterSeconds: N })`. A aplicação nunca
> remove documento e a coleção cresce indefinidamente.

---

## Docker

```bash
make docker-build   # usa o .npmrc do host como secret do BuildKit (não vira layer)
make docker-run
```

- Imagem base **alinhada ao `.nvmrc`** (`node:24-alpine` ↔ `24`). Ao atualizar um,
  atualize o outro.
- **Nenhuma config por build-arg**: toda variável é injetada em **runtime**.
- Usuário **não-root** (`USER node`), com `uploads/` criado com o dono correto.
