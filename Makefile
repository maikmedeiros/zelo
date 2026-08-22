.PHONY: install dev build start lint fix security migrate \
        db-up db-down db-reset db-wait db-logs db-psql db-migrate \
        docker-build docker-run

NODE_ENV ?= development
IMAGE    ?= zelo-api
TAG      ?= latest

# O Compose interpola do `.env`, que aqui só tem NODE_ENV — as credenciais estão no
# `.env.<NODE_ENV>`. Apontar o --env-file mantém compose e app com a MESMA senha.
COMPOSE  ?= docker compose --env-file .env.$(NODE_ENV)
PSQL     ?= $(COMPOSE) exec -T postgres psql -v ON_ERROR_STOP=1 -U $(PG_USER) -d $(PG_DB_NAME)

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

# APAGA o volume e sobe de novo — as migrations rodam do zero pelo initdb.
db-reset:
	$(COMPOSE) down -v
	$(MAKE) db-up

db-wait:
	$(COMPOSE) up -d --wait

db-logs:
	$(COMPOSE) logs -f postgres

db-psql:
	$(COMPOSE) exec postgres psql -U $(PG_USER) -d $(PG_DB_NAME)

# Reaplica as migrations num banco JÁ inicializado (o initdb não roda de novo). Use quando
# adicionar uma migration nova sem querer perder os dados. Os scripts não são idempotentes,
# então rode só a nova: `make db-migrate FILES=db/migrations/004_x.sql`
FILES ?= $(sort $(wildcard db/migrations/*.sql))
db-migrate:
	@for file in $(FILES); do \
		echo "→ $$file"; \
		$(PSQL) -f /dev/stdin < $$file || exit 1; \
	done

# ── Migrations em banco externo (homolog/produção) ────────────────────────────
# Exige `psql` no host e as PG_* no ambiente. Para o banco local, use db-migrate.
migrate:
	@for file in $$(ls db/migrations/*.sql | sort); do \
		echo "→ $$file"; \
		psql "postgresql://$(PG_USER):$(PG_PASSWORD)@$(PG_HOST):$(PG_PORT)/$(PG_DB_NAME)" -v ON_ERROR_STOP=1 -f $$file || exit 1; \
	done

# O secret do npmrc é opcional: sem registry privado, o build usa o público.
docker-build:
	docker build --secret id=npmrc,src=$$HOME/.npmrc -t $(IMAGE):$(TAG) .

docker-run:
	docker run --rm -p 3000:3000 --env-file .env $(IMAGE):$(TAG)
