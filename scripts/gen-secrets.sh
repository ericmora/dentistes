#!/bin/bash
set -euo pipefail

NAMESPACE="${NAMESPACE:-dentistes}"
OUT="${SECRET_FILE:-$HOME/.mcp/credentials/dentistes-k8s-secret.yaml}"

OWNER_PASS="$(openssl rand -hex 14)"
APP_PASS="$(openssl rand -hex 14)"
JWT_SECRET="$(openssl rand -hex 32)"
ADMIN_PASS="$(openssl rand -hex 10)"
ADMIN_EMAIL="${BOOTSTRAP_ADMIN_EMAIL:-ericmora82@gmail.com}"

mkdir -p "$(dirname "$OUT")"
chmod 700 "$(dirname "$OUT")"

umask 077
cat > "$OUT" <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: dentistes-secrets
  namespace: ${NAMESPACE}
type: Opaque
stringData:
  postgres-password: "${OWNER_PASS}"
  app-db-password: "${APP_PASS}"
  DATABASE_URL: "postgres://dentistes_app:${APP_PASS}@postgres:5432/dentistes?sslmode=disable"
  MIGRATION_DATABASE_URL: "postgres://dentistes:${OWNER_PASS}@postgres:5432/dentistes?sslmode=disable"
  JWT_SECRET: "${JWT_SECRET}"
  STRIPE_SECRET_KEY: "${STRIPE_SECRET_KEY:-}"
  STRIPE_WEBHOOK_SECRET: "${STRIPE_WEBHOOK_SECRET:-}"
  BOOTSTRAP_ADMIN_EMAIL: "${ADMIN_EMAIL}"
  BOOTSTRAP_ADMIN_PASSWORD: "${ADMIN_PASS}"
EOF
chmod 600 "$OUT"

echo "Secret generado: $OUT"
echo "Admin inicial: ${ADMIN_EMAIL}"
echo "Guarda este fichero. No lo vuelvas a generar después de desplegar (rotaría las contraseñas de la BD)."

if [[ "${1:-}" == "--apply" ]]; then
  kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
  kubectl apply -f "$OUT"
  echo "Namespace ${NAMESPACE} y secret aplicados."
fi
