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
nvm use                 # lê o .nvmrc (lts/jod — Node 22)
npm ci
cp .env.example .env    # e preencha
make migrate            # aplica db/migrations/*.sql em ordem
npm run dev             # sobe na porta do .env
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
| `MONGO_LOG_ENABLED`       | não (`false`)       | liga o log de request/response                                   |
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

- Imagem base **alinhada ao `.nvmrc`** (`node:22-alpine` ↔ `lts/jod`). Ao atualizar um,
  atualize o outro.
- **Nenhuma config por build-arg**: toda variável é injetada em **runtime**.
- Usuário **não-root** (`USER node`), com `uploads/` criado com o dono correto.
