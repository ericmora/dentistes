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
TENANT_BASE_DOMAIN="${TENANT_BASE_DOMAIN:-dentistes.2mes4.com}"

echo "==> Build API binary (native cross-compile linux/amd64)"
(cd apps/api && GOOS=linux GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o api-linux-amd64 ./cmd/api)
echo "==> Build & push API image"
docker buildx build --platform linux/amd64 \
  -f apps/api/Dockerfile.runtime \
  --output "type=registry,name=$REGISTRY/dentistes/api:$TAG,registry.insecure=true" apps/api
rm -f apps/api/api-linux-amd64

echo "==> Build & push backup"
docker buildx build --platform linux/amd64 \
  --output "type=registry,name=$REGISTRY/dentistes/backup:$TAG,registry.insecure=true" deploy/backup

for app in web admin marketing; do
  case "$app" in
    web) VITE_APP="$APP_URL" ;;
    admin) VITE_APP="$ADMIN_URL" ;;
    marketing) VITE_APP="$APP_URL" ;;
  esac
  echo "==> Build & push $app"
  docker buildx build --platform linux/amd64 \
    -f "apps/$app/Dockerfile" \
    --build-arg "VITE_API_URL=$API_URL" \
    --build-arg "VITE_APP_URL=$VITE_APP" \
    --build-arg "VITE_TENANT_BASE_DOMAIN=$TENANT_BASE_DOMAIN" \
    --output "type=registry,name=$REGISTRY/dentistes/$app:$TAG,registry.insecure=true" .
done

if [[ "${BUILD_ONLY:-0}" == "1" ]]; then
  echo "==> BUILD_ONLY=1: imágenes publicadas, sin aplicar manifiestos"
  exit 0
fi

echo "==> Apply kustomize"
kubectl apply -k deploy/k3s/overlays/prod

echo "==> Restart deployments to pick up the new :latest images"
kubectl -n "$NAMESPACE" rollout restart deployment/api deployment/web deployment/admin deployment/marketing

echo "==> Wait for rollouts"
kubectl -n "$NAMESPACE" rollout status deployment/api --timeout=180s
kubectl -n "$NAMESPACE" rollout status deployment/web --timeout=120s
kubectl -n "$NAMESPACE" rollout status deployment/admin --timeout=120s
kubectl -n "$NAMESPACE" rollout status deployment/marketing --timeout=120s

echo "==> Deployed"
