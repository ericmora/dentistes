# Dentistes

Base aplicativa del software de gestión dental multi-clínica descrito en la documentación de Google Drive del proyecto.

Estado: **base funcional para iniciar desarrollo**. Incluye identidad multi-tenant, permisos por rol y por funcionalidad, planes, cobros automatizados con Stripe, SDK JS, webapp, panel global, web comercial, app móvil, CLI, backend Go, esquema PostgreSQL 16 con RLS y despliegue k3s con backups.

## Stack

| Capa | Tecnología |
| --- | --- |
| Backend | Go 1.24, chi, pgx, JWT, Argon2id |
| Base de datos | PostgreSQL 16 con Row-Level Security, JSONB y GIN |
| SDK | TypeScript, `fetch`, ESM |
| Webapp / Admin / Marketing | React 18, Vite, Tailwind, TanStack Query, Zustand, React Hook Form, Zod, Lucide |
| Móvil | Expo / React Native + SDK |
| CLI | Node.js + Commander + SDK |
| Infra | K3s, Traefik, cert-manager, Kustomize, backups `pg_dump` + rclone opcional |

## Monorepo

```text
apps/
  api/          Backend Go + migraciones SQL
  web/          Webapp de clínica (React + Vite)
  admin/        Administración global (React + Vite)
  marketing/    Web comercial con precios (React + Vite)
  mobile/       App móvil (Expo)
  cli/          CLI `dentistes`
packages/
  sdk/          @dentistes/sdk (cliente tipado)
  ui/           Componentes y tokens de diseño
deploy/
  k3s/          Kustomize base + overlay prod
  backup/       Imagen y script de backup
  postgres/     Init del rol de aplicación
docs/           Arquitectura, API, operaciones, ADRs y requisitos
```

## Desarrollo local

```bash
cp .env.example .env
pnpm install
make db-up          # PostgreSQL 16 en Docker
make db-migrate     # crea esquema, RLS, seeds y rol dentistes_app
make run-api        # API en http://localhost:8080
pnpm dev:web        # http://localhost:5173
pnpm dev:admin      # http://localhost:5174
pnpm dev:marketing  # http://localhost:5175
```

Admin inicial: el definido por `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD` en `.env` (por defecto `admin@example.com` / `change-me-now-please`).

Comprobación:

```bash
pnpm run check      # typecheck de apps + vet/tests de Go
pnpm run build      # SDK, web, admin, marketing y CLI
curl http://localhost:8080/health
```

Si el volumen de PostgreSQL ya existía antes de configurar `deploy/postgres/10-app-role.sh`, el rol `dentistes_app` no se habrá creado: recrea el volumen (`docker compose down -v`) o crea el rol manualmente.

## Identidad y multi-tenancy

- `users` es global; `memberships` une usuario y tenant con rol (`OWNER`, `ADMIN`, `DENTIST`, `HYGIENIST`, `RECEPTIONIST`).
- Cada request autenticada abre una transacción y ejecuta `set_config('app.current_tenant_id', ..., true)`; las tablas clínicas tienen **RLS forzado**.
- El runtime conecta como `dentistes_app` (sin superuser, sin ownership). Las migraciones corren como el rol owner (`MIGRATION_DATABASE_URL`).
- Contraseñas con Argon2id, access token JWT de 15 min y refresh token opaco rotado con hash en `sessions`.
- El refresh token viaja en cookie `HttpOnly` para navegador y en JSON para clientes nativos (CLI/móvil).
- Gestión de miembros por tenant (`/v1/users`): crear/añadir por email, cambiar rol y activar/desactivar. Los cambios de rol y las bajas se aplican al instante (cada request valida la membership).
- Salvaguardas: no puedes desactivarte a ti mismo y el tenant siempre conserva al menos un `OWNER` activo.

## Provisioning de tenants

Cada alta (`POST /v1/public/onboarding` o `/v1/public/signup`) crea en una sola transacción: tenant, usuario owner, membership, configuración por defecto, `1..N` gabinetes, dominio primario `tenant_domains`, cliente Stripe y sesión de Stripe Checkout con `trial_period_days=30` (suscripción `INCOMPLETE` hasta completar la tarjeta en Stripe, momento en que pasa a `TRIALING`).

Un worker dentro de la API (`K8S_PROVISIONING=true`) reclama dominios pendientes y crea/actualiza el Ingress del tenant:

- host `<subdominio>.<TENANT_BASE_DOMAIN>` → servicio `web`;
- anotación `cert-manager.io/cluster-issuer` → certificado Let's Encrypt por tenant;
- TLS secret `tenant-<subdominio>-tls`;
- estados `PENDING → PROVISIONING → READY` (o `FAILED` con reintento exponencial).

Requiere DNS wildcard `*.dentistes.2mes4.com` y cert-manager con HTTP-01. El panel global muestra el dominio y permite reprovisionar; el RBAC del ServiceAccount solo permite gestionar Ingresses en el namespace.

## Permisos y funcionalidades

Dos capas independientes:

1. **Entitlements del tenant**: plan + overrides (`tenant_features`) + estado de suscripción → qué módulos están disponibles (`patients`, `agenda`, `odontogram`, `clinical_history`, `whatsapp`, `waiting_list`, `billing_pdf`, `reports`).
2. **RBAC del rol**: qué acciones puede hacer un usuario dentro de los módulos (`patients:read`, `patients:write`, `clinical:read`, `billing:manage`, `users:manage`, etc.).

La API expone `GET /v1/me` con `features`, `permissions`, plan y estado de suscripción; el SDK y los frontends usan esos datos para ocultar o bloquear acciones. Los endpoints protegidos devuelven `402 FEATURE_NOT_ENTITLED` si el tenant no tiene el módulo o `403` si el rol no tiene el permiso.

Los checkboxes del panel global escriben overrides por tenant y reflejan el estado efectivo (plan + override + suscripción).

## Cobros automatizados

- Stripe Checkout para contratar plan (`POST /v1/billing/checkout`).
- Stripe Billing Portal para tarjetas y facturas (`POST /v1/billing/portal`).
- Webhook `POST /v1/webhooks/stripe` con verificación de firma.
- Estados de suscripción: `TRIALING`, `ACTIVE`, `PAST_DUE`, `CANCELED`, `INCOMPLETE`, `UNPAID`.
- Solo `ACTIVE` y `TRIALING` vigentes desbloquean funcionalidades. `PAST_DUE`, `CANCELED`, `UNPAID` y trial caducado bloquean los módulos automáticamente.
- El trial inicial es de 30 días (`TRIAL_DAYS`).

Configura en Stripe el webhook `https://api.dentistes.2mes4.com/v1/webhooks/stripe` y guarda el secret en `STRIPE_WEBHOOK_SECRET`. Los productos y precios se generan desde la tabla `plans` con `./scripts/stripe-sync.sh` (idempotente; `--dry-run` para revisar).

## SDK

```ts
import { DentistesClient } from "@dentistes/sdk";

const sdk = new DentistesClient({ baseUrl: "https://api.dentistes.2mes4.com" });
await sdk.login("owner@clinica.test", "password");
const me = await sdk.me();
if (me.features.odontogram) {
  // módulo disponible
}
const patients = await sdk.listPatients({ q: "ana" });
```

Modo navegador: cookie `HttpOnly`. Modo nativo (`mode: "native"`): refresh token explícito y callback para persistirlo (lo usa el CLI).

## CLI

```bash
pnpm --filter @dentistes/cli build
node apps/cli/dist/index.js login --api http://localhost:8080 -e owner@clinica.test -p password
node apps/cli/dist/index.js whoami
node apps/cli/dist/index.js features
node apps/cli/dist/index.js patients list
node apps/cli/dist/index.js billing status
```

## Despliegue k3s

Requisitos: sesión de host activa con `/Users/eric/Workspace/host/hostctl session start`, `KUBECONFIG=~/.kube/config-161`, acceso al registry privado (`155.133.27.1:5000`) y DNS para `dentistes.2mes4.com`, `app.`, `admin.` y `api.`.

1. Crea los secretos (no commitees valores reales):

```bash
cp deploy/k3s/base/secret.example.yaml /tmp/dentistes-secret.yaml
# edita /tmp/dentistes-secret.yaml
kubectl apply -f /tmp/dentistes-secret.yaml
```

2. Despliega (build linux/amd64 + push + kustomize + rollout):

```bash
./deploy/deploy.sh
```

3. Configura el webhook de Stripe y las variables de entorno de OAuth/URLs en `deploy/k3s/base/configmap.yaml` si cambia el dominio.

Detalles en [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Backups

`deploy/k3s/base/backup.yaml` define un CronJob diario a las 02:00 que:

- ejecuta `pg_dump -Fc` y comprime en el PVC `dentistes-backups`;
- retiene 14 días;
- opcionalmente copia offsite con `rclone` si configuras `RCLONE_REMOTE` y el secreto `dentistes-rclone`.

Restauración documentada en [docs/OPERATIONS.md](docs/OPERATIONS.md).

## Seguridad

- RLS forzado en todas las tablas con `tenant_id`; el runtime no es owner ni superuser.
- Tokens y contraseñas nunca se loguean; Argon2id; refresh tokens hasheados y rotados.
- Rate limit básico en login/signup; cabeceras de seguridad; CORS restringido.
- Secretos fuera del repositorio; `deploy/k3s/base/secret.yaml` está en `.gitignore`.
- Pendiente de hardening: MFA/TOTP, verificación de email, recuperación de contraseña, rotación de secretos, separación de roles de migración y runtime en bases gestionadas.

## Roadmap de producto

La base incluye el esquema de datos de F1–F6 y el primer slice vertical de pacientes. Las funcionalidades clínicas completas (odontograma, agenda en tiempo real, historial, WhatsApp/Mastra, lista de espera, facturación PDF con QR) se implementan sobre estos cimientos.

## Documentación

- [Arquitectura](docs/ARCHITECTURE.md)
- [API](docs/API.md)
- [Operaciones](docs/OPERATIONS.md)
- [Requisitos y trazabilidad](docs/REQUIREMENTS.md)
- [ADRs](docs/adr/)

La documentación de producto vive en Google Drive y se sincroniza con `drive sync` (skill `google-drive`).
