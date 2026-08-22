.PHONY: install dev build start lint fix security migrate \
        db-up db-down db-reset db-wait db-logs db-psql \
        docker-build docker-run

NODE_ENV ?= development
IMAGE    ?= zelo-api
TAG      ?= latest

# O Compose interpola do `.env`, que aqui só tem NODE_ENV — as credenciais estão no
# `.env.<NODE_ENV>`. Apontar o --env-file mantém compose e app com a MESMA senha.
COMPOSE  ?= docker compose --env-file .env.$(NODE_ENV)

# Lidas do .env.<NODE_ENV> para os alvos que chamam o psql dentro do container.
PG_USER    ?= $(shell sed -n "s/^PG_USER=//p" .env.$(NODE_ENV))
PG_DB_NAME ?= $(shell sed -n "s/^PG_DB_NAME=//p" .env.$(NODE_ENV))

install:
	npm ci

dev:
	npm run dev

build:
	npm run build

start:
	npm start

lint:
	npm run lint:prettier:check && npm run lint:eslint:check

fix:
	npm run lint:eslint:fix && npm run lint:prettier:fix

security:
	npm run security:all

# ── Banco local (Docker) ─────────────────────────────────────────────────────
# `up -d --wait` só retorna quando o healthcheck passa, então o `npm run dev` que vier
# depois já encontra o banco pronto.
db-up:
	$(COMPOSE) up -d --wait
	@echo "PostgreSQL pronto em localhost:$$(sed -n 's/^PG_PORT=//p' .env.$(NODE_ENV))"

db-down:
	$(COMPOSE) down

# APAGA o volume e sobe de novo. O esquema volta na próxima subida da aplicação (ou num
# `make migrate`): o initdb do Postgres não aplica mais nada.
db-reset:
	$(COMPOSE) down -v
	$(MAKE) db-up

db-wait:
	$(COMPOSE) up -d --wait

db-logs:
	$(COMPOSE) logs -f postgres

db-psql:
	$(COMPOSE) exec postgres psql -U $(PG_USER) -d $(PG_DB_NAME)

# ── Migrations ────────────────────────────────────────────────────────────────
# Cria o banco se ele não existir e aplica só o que ainda não rodou, pela tabela de
# controle `schema_migration`. É o MESMO código do boot da aplicação — não existe segundo
# caminho de migration para divergir. O alvo do banco vem das PG_* do .env.$(NODE_ENV),
# então serve tanto para o local quanto para homologação/produção.
migrate:
	npm run db:migrate

# O secret do npmrc é opcional: sem registry privado, o build usa o público.
docker-build:
	docker build --secret id=npmrc,src=$$HOME/.npmrc -t $(IMAGE):$(TAG) .

docker-run:
	docker run --rm -p 3000:3000 --env-file .env $(IMAGE):$(TAG)
