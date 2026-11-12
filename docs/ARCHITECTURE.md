# Arquitectura

Este documento resume cómo la base implementa la arquitectura descrita en Google Drive y qué decisiones se tomaron al aterrizarla.

## Fuentes

- `README - Software Gestió Dental` — visión, estructura documental.
- `Arquitectura/Arquitectura Overview` — Go, PostgreSQL 16, React/Vite/Tailwind, Ingress TLS, RBAC.
- `Arquitectura/Model de Dades - Especificació PostgreSQL 16+` — esquema, RLS, JSONB.
- `ADRs/ADR-001 Multi-Tenancy RLS` — aislamiento por fila.
- `ADRs/ADR-002 Automatització WhatsApp Mastra` — agente TypeScript separado.
- `Producte/Funcionalitats de Producte` — F1–F6.

## Vista de componentes

```text
[webapp React] [admin React] [marketing React] [mobile Expo] [CLI Node]
        \            |              |               |          /
         \           |              |               |         /
                  @dentistes/sdk (HTTP + JWT)
                              |
                        [API Go (stateless)]
                         /        |         \
                  PostgreSQL     Stripe     WhatsApp/Mastra
                  (RLS, JSONB)  (billing)   (futuro, F4)
```

- La API Go es stateless; las sesiones viven en PostgreSQL.
- Los frontends no acceden a la base de datos: solo al SDK.
- El futuro servicio Mastra/WhatsApp llamará a la API REST con credenciales de servicio por tenant; no tocará PostgreSQL directamente (ADR-002).

## Multi-tenancy

- Modelo shared database / shared schema con `tenant_id` en todas las tablas de negocio y **RLS forzado** (`FORCE ROW LEVEL SECURITY`).
- Cada request autenticada abre una transacción y fija `app.current_tenant_id` con `set_config(..., true)` (local a la transacción).
- El runtime usa el rol `dentistes_app`, sin privilegios de owner ni superuser. Las migraciones usan un rol owner separado.
- `memberships` tiene una política adicional por `app.current_user_id` para poder listar los tenants del usuario durante login/refresh.
- Nunca se ejecutan queries de negocio fuera de una transacción con contexto de tenant.

## Identidad y sesiones

- Usuarios globales (`users`) y pertenencia por tenant (`memberships`) con rol.
- Contraseñas Argon2id (`m=64MiB, t=3, p=2`).
- Access token JWT HS256 (15 min) con `sub`, `tid`, `role`, `adm`.
- Refresh token opaco de 32 bytes, almacenado como SHA-256 en `sessions`, rotado en cada refresh.
- Navegador: refresh en cookie `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/v1/auth`.
- CLI/móvil: refresh token explícito (`X-Client: native`), persistido por el cliente.
- La app global de administración usa un usuario `is_platform_admin` sin tenant; sus rutas viven bajo `/v1/admin` y no entran en el contexto RLS de tenant salvo para operaciones concretas.

## Autorización en dos capas

1. **Funcionalidades del tenant** (`features` + `plans` + `plan_features` + `tenant_features` + `subscriptions`):
   - `base` (18,50 USD/mes, trial 30 días): `patients`, `agenda`, `odontogram`, `clinical_history`, `waiting_list`, `billing_pdf`, `reports`.
   - Add-ons activables vía `tenant_features`: `whatsapp`, `digital_signature`.
   - Planes heredados (`starter`, `clinic`, `enterprise`) marcados como inactivos (`is_active = false`).
   - Overrides por tenant con expiración opcional.
   - Estado de suscripción (`ACTIVE`/`TRIALING`) obligatorio para habilitar.
2. **Permisos del rol** (`OWNER`, `ADMIN`, `DENTIST`, `HYGIENIST`, `RECEPTIONIST`):
   - `patients:read/write`, `clinical:read/write/alerts`, `appointments:read/write`, `billing:read/write/manage`, `users:manage`, `settings:manage`.
   - `OWNER` tiene `*`.

La API devuelve `402` cuando el módulo no está contratado y `403` cuando el rol no permite la acción. `GET /v1/me` entrega ambos mapas para que la UI pueda renderizar bloqueos y CTAs de upgrade.

## Billing

- Stripe Checkout (suscripción) y Billing Portal.
- Webhook con verificación HMAC de firma (`Stripe-Signature`), tolerancia 5 min.
- Eventos tratados: `checkout.session.completed`, `customer.subscription.created|updated|deleted`, `invoice.paid`, `invoice.payment_failed`.
- `tenant_id` viaja en metadata de customer, checkout y subscription; el webhook fija el contexto del tenant antes de escribir.
- La suscripción se sincroniza con plan (por `stripe_price_id`), estado, periodo y cancelación.
- La elegibilidad se calcula en cada request; no hay job de bloqueo: si el estado deja de ser `ACTIVE`/`TRIALING` vigente, las features se bloquean inmediatamente.

## Provisioning de tenants

1. `POST /v1/public/onboarding` (y `/v1/public/signup`) crea tenant, owner, membership, gabinetes (`1..N`), configuración regional, `tenant_domains` (hostname + TLS secret), cliente Stripe, Checkout Session con 30 días de trial (`payment_method_collection=always`) y suscripción `INCOMPLETE` en una sola transacción (con rollback si Stripe falla).
2. Al completar Stripe Checkout (vía `POST /v1/billing/confirm-checkout` o webhook), la suscripción pasa a `TRIALING` con los 30 días activos.
3. El worker de la API (`K8S_PROVISIONING=true`) reclama dominios `PENDING/FAILED` con `FOR UPDATE SKIP LOCKED`, marca `PROVISIONING` y llama al API de Kubernetes.
3. El provisioner crea/actualiza un Ingress determinista `tenant-<subdominio>` con:
   - regla host → servicio `web:8080`;
   - anotación `cert-manager.io/cluster-issuer=letsencrypt-prod`;
   - TLS secret `tenant-<subdominio>-tls`.
4. cert-manager emite el certificado mediante HTTP-01 (el DNS wildcard resuelve el reto).
5. El worker marca `READY` o `FAILED` con backoff; el panel global permite reprovisionar.

El API corre con un ServiceAccount con Role limitado a `networking.k8s.io/ingresses` en el namespace. El wildcard DNS cubre todos los subdominios de tenant; el apex se publica aparte para la web comercial.

## Datos

- Esquema completo de identidad, billing y negocio (pacientes, historial, odontograma, agenda, lista de espera, WhatsApp, catálogo, facturas, pagos) en `apps/api/migrations`.
- JSONB con GIN para `patients.medical_alerts` y `odontograms.teeth_data`.
- `clinical_records` es append-only por convención de aplicación (sin UPDATE/DELETE en endpoints); añadir triggers de inmutabilidad es el siguiente hardening.
- Índices por tenant y por consultas de agenda/paciente.

## Frontends

- React 18 + Vite + TypeScript estricto + Tailwind, siguiendo el design system documentado (`@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `lucide-react`).
- `packages/ui` contiene tokens semánticos (`tokens.css` + `tailwind-preset.cjs`), primitivas (incluidos `Modal`, `Sheet`, `Tabs`, `Combobox`, `ToastProvider`, etc.), `FeatureGate`/`PermissionGate`/`RoleGuard` y componentes clínicos (`CriticalAlertBanner`, `ToothSurfaceRenderer`, `OdontogramGrid`, `AppointmentCard`, `MultiCabinetTimeline`, `WaitingListCandidateCard`, `ClinicalHistoryTimeline`, `InvoiceLineEditor`, `QRVerifierBlock`).
- Cuatro apps: webapp clínica, admin global, marketing comercial y móvil Expo.
- El SDK centraliza auth, refresh, errores tipados y recursos; las apps no construyen URLs a mano.

## Despliegue

- Namespace `dentistes` en K3s.
- PostgreSQL StatefulSet con PVC; init del rol de app vía ConfigMap.
- API 2 réplicas con probes, migraciones al arrancar con advisory lock.
- Frontends estáticos servidos por nginx unprivileged.
- Ingress Traefik con cert-manager (`letsencrypt-prod`).
- NetworkPolicies: solo Traefik entra a las apps; solo API y backup hablan con PostgreSQL; la API puede salir a Stripe por 443.
- Backups diarios a PVC y copia offsite opcional con rclone.

## Desviaciones conscientes de la documentación

- **Firebase Auth → auth propia**: la documentación propone Firebase. Para soberanía de datos, evitar dependencia externa y permitir MFA futuro en el mismo backend, se implementa JWT + Argon2id. Ver ADR-0001.
- **`users.tenant_id` → usuarios globales + memberships**: permite que un profesional pertenezca a varias clínicas y separa platform admins. Ver ADR-0002.
- **RBAC + features**: la doc describe RBAC; aquí se añade la capa de entitlements por plan/override, necesaria para bloquear funcionalidades por impago. Ver ADR-0003.
