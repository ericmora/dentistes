SHELL := /bin/bash
REGISTRY ?= 155.133.27.1:5000
TAG ?= latest
NAMESPACE ?= dentistes

.PHONY: help install build check test api web admin marketing cli db-up db-migrate run-api deploy-backend deploy-frontends

help:
	@echo "make install        Instala dependencias JS"
	@echo "make build          Build de SDK + apps frontend"
	@echo "make check          Typecheck + vet + tests"
	@echo "make test           Tests de Go"
	@echo "make db-up          PostgreSQL local (docker compose)"
	@echo "make db-migrate     Aplica migraciones"
	@echo "make run-api        API en local"
	@echo "make deploy         Build/push imagenes amd64 + kubectl apply -k"

install:
	pnpm install

build:
	pnpm run build

check:
	pnpm run check

test:
	cd apps/api && go test ./...

db-up:
	docker compose up -d postgres

db-migrate:
	set -a; [ -f .env ] && . ./.env || true; set +a; cd apps/api && go run ./cmd/api migrate

run-api:
	set -a; [ -f .env ] && . ./.env || true; set +a; cd apps/api && go run ./cmd/api

provision:
	set -a; [ -f .env ] && . ./.env || true; set +a; cd apps/api && go run ./cmd/api provision

deploy:
	REGISTRY=$(REGISTRY) TAG=$(TAG) NAMESPACE=$(NAMESPACE) ./deploy/deploy.sh
