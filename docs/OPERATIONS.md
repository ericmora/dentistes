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

## Despliegue

```bash
REGISTRY=155.133.27.1:5000 TAG=latest ./deploy/deploy.sh
```

El script:

1. compila y sube imágenes `linux/amd64` (API, backup, web, admin, marketing);
2. aplica `deploy/k3s/overlays/prod`;
3. espera los rollouts.

DNS necesario: `dentistes.2mes4.com`, `app.dentistes.2mes4.com`, `admin.dentistes.2mes4.com`, `api.dentistes.2mes4.com`. cert-manager emite `dentistes-tls` con `letsencrypt-prod`.

## Migraciones

- La API ejecuta migraciones al arrancar usando `MIGRATION_DATABASE_URL`, con advisory lock para evitar carreras entre réplicas.
- Comando manual: `apps/api` con `DATABASE_URL`/`MIGRATION_DATABASE_URL` y `go run ./cmd/api migrate`.
- Migraciones embebidas en el binario (`apps/api/migrations`).
- El rol de app se crea en el init de PostgreSQL (primer arranque del PVC). Si el PVC ya existía, crea el rol manualmente o recrea el volumen.

## Stripe

1. Crea productos/precios en Stripe (suscripción mensual).
2. En el panel global → Planes, asigna el `price_...` a `starter`, `clinic`, `enterprise`.
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
