#!/bin/bash
set -euo pipefail

REGISTRY="${REGISTRY:-155.133.27.1:5000}"
TAG="${TAG:-latest}"
NAMESPACE="${NAMESPACE:-dentistes}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

APP_URL="${APP_URL:-https://app.dentistes.2mes4.com}"
ADMIN_URL="${ADMIN_URL:-https://admin.dentistes.2mes4.com}"
MARKETING_URL="${MARKETING_URL:-https://dentistes.2mes4.com}"
API_URL="${API_URL:-https://api.dentistes.2mes4.com}"

echo "==> Build & push API"
docker buildx build --platform linux/amd64 \
  -t "$REGISTRY/dentistes/api:$TAG" --push apps/api

echo "==> Build & push backup"
docker buildx build --platform linux/amd64 \
  -t "$REGISTRY/dentistes/backup:$TAG" --push deploy/backup

for app in web admin marketing; do
  case "$app" in
    web) VITE_APP="$APP_URL" ;;
    admin) VITE_APP="$ADMIN_URL" ;;
    marketing) VITE_APP="$MARKETING_URL" ;;
  esac
  echo "==> Build & push $app"
  docker buildx build --platform linux/amd64 \
    -f "apps/$app/Dockerfile" \
    --build-arg "VITE_API_URL=$API_URL" \
    --build-arg "VITE_APP_URL=$VITE_APP" \
    -t "$REGISTRY/dentistes/$app:$TAG" --push .
done

echo "==> Apply kustomize"
kubectl apply -k deploy/k3s/overlays/prod

echo "==> Wait for rollouts"
kubectl -n "$NAMESPACE" rollout status deployment/api --timeout=180s
kubectl -n "$NAMESPACE" rollout status deployment/web --timeout=120s
kubectl -n "$NAMESPACE" rollout status deployment/admin --timeout=120s
kubectl -n "$NAMESPACE" rollout status deployment/marketing --timeout=120s

echo "==> Deployed"
