.PHONY: install dev build start lint fix security migrate docker-build docker-run

NODE_ENV ?= development
IMAGE    ?= zelo-api
TAG      ?= latest

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

# Aplica as migrations em ordem numérica. Exige PGPASSWORD/PG* no ambiente.
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
