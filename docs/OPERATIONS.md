# Operaciones

## Local

```bash
cp .env.example .env
pnpm install
make db-up
make db-migrate
make run-api
```

En otra terminal:

```bash
pnpm dev:web
pnpm dev:admin
pnpm dev:marketing
```

El CLI y el móvil apuntan a `VITE_API_URL`/`DENTISTES_API_URL` o a la URL indicada en el login.

## Secretos en k3s

El manifiesto de ejemplo está en `deploy/k3s/base/secret.example.yaml` y **no se aplica** por Kustomize. Crea el secreto real:

```bash
cp deploy/k3s/base/secret.example.yaml /tmp/dentistes-secret.yaml
$EDITOR /tmp/dentistes-secret.yaml
kubectl apply -f /tmp/dentistes-secret.yaml
```

Claves:

| Clave | Uso |
| --- | --- |
| `postgres-password` | Rol owner `dentistes` (migraciones y backups) |
| `app-db-password` | Rol runtime `dentistes_app` |
| `DATABASE_URL` | Debe usar `dentistes_app` y coincidir con `app-db-password` |
| `MIGRATION_DATABASE_URL` | Debe usar `dentistes` owner |
| `JWT_SECRET` | Firma de access tokens (≥16 chars, ideal 32+ aleatorios) |
| `STRIPE_SECRET_KEY` | API de Stripe (`sk_live_...`/`sk_test_...`) |
| `STRIPE_WEBHOOK_SECRET` | Secreto del endpoint de webhook (`whsec_...`) |
| `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` | Platform admin inicial (solo se crea si no existe ninguno) |

Opcional: secreto `dentistes-rclone` con `rclone.conf` para copia offsite.

## DNS

Con un wildcard `*.dentistes.2mes4.com` apuntando al Ingress:

- `dentistes.2mes4.com` → web comercial (marketing). **El wildcard no cubre el apex**: crea también el registro A/AAAA del dominio raíz.
- `app.dentistes.2mes4.com` → webapp.
- `admin.dentistes.2mes4.com` → panel global.
- `api.dentistes.2mes4.com` → API.

El Ingress usa certificados por host con `letsencrypt-prod` (HTTP-01). No se ha configurado un solver DNS-01; si se quiere un certificado wildcard `*.dentistes.2mes4.com` hay que añadir el solver DNS del proveedor en cert-manager.

## Generar secretos iniciales

```bash
./scripts/gen-secrets.sh            # genera ~/.mcp/credentials/dentistes-k8s-secret.yaml
./scripts/gen-secrets.sh --apply    # crea namespace + aplica el secret (requiere kubectl)
```

No lo re-ejecutes tras el despliegue: rotarías las contraseñas de PostgreSQL. Para añadir Stripe después, parchea solo esas claves:

```bash
kubectl -n dentistes patch secret dentistes-secrets --type merge -p '{"stringData":{"STRIPE_SECRET_KEY":"sk_...","STRIPE_WEBHOOK_SECRET":"whsec_..."}}'
kubectl -n dentistes rollout restart deployment/api
```

## Acceso al host

Los puertos `22`, `6443` y `5000` están cerrados por defecto. Abre una sesión temporal con la skill `host-ops`:

```bash
/Users/eric/Workspace/host/hostctl session start   # 8 horas
/Users/eric/Workspace/host/hostctl status
```

El kubeconfig de producción es `~/.kube/config-161` (`161.97.75.144`). **No uses** `~/.kube/config-percepta-agents`: apunta a una IP obsoleta.

Para una operación puntual, usa `hostctl exec -- <comando>` y deja que cierre los puertos al terminar. No reinicies el host ni desactives `PasswordAuthentication`.

## Despliegue

```bash
KUBECONFIG="$HOME/.kube/config-161" REGISTRY=155.133.27.1:5000 TAG=latest ./deploy/deploy.sh
```

El script:

1. compila y sube imágenes `linux/amd64` (API, backup, web, admin, marketing);
2. aplica `deploy/k3s/overlays/prod`;
3. fuerza `rollout restart` para que los pods recojan el nuevo `:latest`;
4. espera los rollouts.

Marketing usa `deploy/nginx/static.conf` (404 real); web y admin usan `deploy/nginx/spa.conf` (fallback SPA para `/signup`, `/login`, etc.). Marketing recibe `VITE_APP_URL=https://app.dentistes.2mes4.com` para que los CTA apunten al signup correcto.

DNS necesario: `dentistes.2mes4.com`, `app.dentistes.2mes4.com`, `admin.dentistes.2mes4.com`, `api.dentistes.2mes4.com`. cert-manager emite `dentistes-tls` con `letsencrypt-prod`.

## Migraciones

- La API ejecuta migraciones al arrancar usando `MIGRATION_DATABASE_URL`, con advisory lock para evitar carreras entre réplicas.
- Comando manual: `apps/api` con `DATABASE_URL`/`MIGRATION_DATABASE_URL` y `go run ./cmd/api migrate`.
- Migraciones embebidas en el binario (`apps/api/migrations`).
- El rol de app se crea en el init de PostgreSQL (primer arranque del PVC). Si el PVC ya existía, crea el rol manualmente o recrea el volumen.

## Provisioning de tenants

Flujo automático al hacer signup:

1. Se crea el dominio en `tenant_domains` como `PENDING`.
2. El worker de la API (`K8S_PROVISIONING=true`) lo reclama y crea el Ingress.
3. cert-manager emite el certificado Let's Encrypt por host (HTTP-01).
4. El dominio pasa a `READY`; si falla, `FAILED` con reintento exponencial (30s × intento, máx. 10 min).

Comandos útiles:

```bash
kubectl -n dentistes logs deploy/api | grep -i tenant
kubectl -n dentistes get ingress | grep tenant-
kubectl -n dentistes get certificate
kubectl -n dentistes get secret | grep tenant-
```

Reprovisionar un tenant desde el panel global (Dominio → Reprovisionar) o:

```bash
kubectl -n dentistes exec deploy/api -- /app/api provision
```

`POST /v1/admin/tenants/{id}/provision` reencola; el worker lo procesa en `PROVISION_INTERVAL` (30s).

Requisitos: DNS wildcard `*.dentistes.2mes4.com` apuntando al Ingress y cert-manager con HTTP-01. El RBAC `dentistes-api` solo puede gestionar Ingresses en el namespace `dentistes`.

## Stripe y planes

Los productos y precios mensuales se generan desde la tabla `plans`. El script es idempotente:

1. Define los precios en la base de datos (panel global → Planes, o SQL sobre `plans.price_monthly_cents`).
2. Sincroniza con Stripe (crea producto si falta, crea price nuevo si cambió importe/moneda, desactiva el anterior y guarda los IDs):

```bash
# dentro del clúster (usa STRIPE_SECRET_KEY del deployment)
./scripts/stripe-sync.sh
./scripts/stripe-sync.sh --dry-run

# en local (lee .env)
./scripts/stripe-sync.sh --local --dry-run
```

El comando es `api stripe-sync`; `--dry-run` muestra lo que haría sin llamar a Stripe.

3. Copia el signing secret del webhook a `STRIPE_WEBHOOK_SECRET` y reinicia el deployment.
3. Añade el webhook `https://api.dentistes.2mes4.com/v1/webhooks/stripe` con eventos:
   - `checkout.session.completed`
   - `customer.subscription.created`, `updated`, `deleted`
   - `invoice.paid`, `invoice.payment_failed`
4. Copia el signing secret a `STRIPE_WEBHOOK_SECRET`.

Prueba local:

```bash
stripe listen --forward-to localhost:8080/v1/webhooks/stripe
```

## Backups

CronJob `postgres-backup` (02:00 UTC diario):

- `pg_dump -Fc` comprimido en `/backups` del PVC `dentistes-backups`.
- retención 14 días.
- copia offsite con `rclone` si `RCLONE_REMOTE` no está vacío y existe el secreto `dentistes-rclone`.

Forzar un backup manual:

```bash
kubectl -n dentistes create job --from=cronjob/postgres-backup backup-manual
kubectl -n dentistes logs job/backup-manual
```

Restaurar:

```bash
kubectl -n dentistes exec -it statefulset/postgres -- sh
# copia el dump al contenedor o restaura desde el PVC
gunzip -c /backups/dentistes-YYYYMMDDTHHMMSSZ.dump.gz | pg_restore -U dentistes -d dentistes --clean --if-exists
```

Para un restore completo, escala la API a 0 antes (`kubectl -n dentistes scale deploy/api --replicas=0`) y vuelve a escalar después.

## Observabilidad

- Logs JSON de la API a stdout (`kubectl logs`).
- `/health` para readiness/liveness.
- Pendiente: métricas Prometheus/OpenTelemetry y alertas de fallo de backup.

## Hardening pendiente

- MFA/TOTP y verificación de email.
- Recuperación de contraseña con tokens de un solo uso.
- Triggers de inmutabilidad para `clinical_records`.
- Rotación de secretos y separación de credenciales de migración por Job.
- WAF/rate limit distribuido en Ingress.
- Cifrado en reposo del PVC (LUKS/NVMe) y backups cifrados con edad/KMS.
- Auditoría de accesos clínicos (tabla `audit_log`).
