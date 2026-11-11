#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-dentistes}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ "${1:-}" == "--local" ]]; then
  shift
  cd "$ROOT/apps/api"
  set -a
  [ -f "$ROOT/.env" ] && . "$ROOT/.env"
  set +a
  exec go run ./cmd/api stripe-sync "$@"
fi

exec kubectl -n "$NAMESPACE" exec deploy/api -- /app/api stripe-sync "$@"
