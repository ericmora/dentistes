# API

Base: `https://api.dentistes.2mes4.com` (local: `http://localhost:8080`). JSON en todos los cuerpos salvo el webhook de Stripe (form/JSON según Stripe).

## Autenticación

- `Authorization: Bearer <access_token>`.
- Access token JWT de 15 minutos.
- Refresh por cookie `HttpOnly` (navegador) o `refresh_token` en el body (clientes nativos con `X-Client: native`).
- Errores: `{"error":{"code":"...","message":"...","details":{...}}}`.

## Público

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/health` | Healthcheck con ping a PostgreSQL |
| GET | `/v1/public/plans` | Planes activos + catálogo de features |
| GET | `/v1/public/tenant?subdomain=...` | Branding y estado del dominio del tenant |
| POST | `/v1/public/onboarding` | Alta guiada mínima de clínica + Stripe Checkout (`trial_period_days=30`) |
| POST | `/v1/public/signup` | Alias de `/v1/public/onboarding` (requiere Stripe) |
| POST | `/v1/public/leads` | Captación de leads / solicitud de demo (rate-limited) |
| POST | `/v1/auth/login` | Login; devuelve access token y memberships |
| POST | `/v1/auth/refresh` | Rota refresh token y emite access token |
| POST | `/v1/auth/logout` | Revoca la sesión |
| POST | `/v1/webhooks/stripe` | Webhook de Stripe (firma obligatoria) |

### Onboarding y Signup

```json
POST /v1/public/onboarding
{
  "clinic_name": "Clínica Dental Example",
  "subdomain": "example",
  "cabinets_count": 2,
  "locale": "ca-ES",
  "full_name": "Ana Owner",
  "email": "ana@example.test",
  "password": "minimo-10-caracteres"
}
```

`subdomain` (auto-generado desde `clinic_name` si se omite), `cabinets_count` (por defecto `1`, de `1` a `20`) y `locale` (`ca-ES`, `es-ES`, `es-MX`, `en-GB`) son opcionales. Crea tenant `TRIAL`, usuario, membership `OWNER`, gabinetes, `tenant_domains`, cliente Stripe y sesión de Stripe Checkout con **30 días de prueba** (`payment_method_collection=always`) y suscripción `INCOMPLETE` hasta completar Stripe (`checkout_url`). Al finalizar el Checkout o confirmar con `POST /v1/billing/confirm-checkout`, la suscripción pasa a `TRIALING` y se activan los 30 días.

### Leads

```json
POST /v1/public/leads
{
  "contact_name": "Laia Serra",
  "clinic_name": "Clínica Garraf",
  "email": "laia@clinicagarraf.cat",
  "phone": "+34 600 111 222",
  "interest": "DEMO",
  "lang": "ca",
  "source": "landing",
  "utm_source": "google"
}
```

`interest` admite `DEMO`, `TRIAL`, `MIGRATION` u `OTHER` (por defecto `DEMO`). Devuelve `201 Created` con el lead creado.

### Login

```json
POST /v1/auth/login
{ "email": "ana@example.test", "password": "...", "tenant_id": "opcional" }
```

Respuesta:

```json
{
  "access_token": "...",
  "token_type": "Bearer",
  "expires_in": 900,
  "user": { "id": "...", "email": "...", "full_name": "...", "is_platform_admin": false },
  "memberships": [{ "tenant_id": "...", "tenant_name": "...", "subdomain": "...", "role": "OWNER", "tenant_status": "TRIAL" }],
  "active_tenant": { "id": "...", "name": "...", "subdomain": "...", "status": "TRIAL", "trial_ends_at": "..." }
}
```

## Autenticado

| Método | Ruta | Permiso | Descripción |
| --- | --- | --- | --- |
| GET | `/v1/me` | sesión + tenant | Usuario, memberships, rol, permisos, features, plan y billing |
| POST | `/v1/auth/switch-tenant` | sesión | Cambia tenant activo y emite nuevos tokens |
| GET | `/v1/billing/subscription` | sesión | Suscripción y entitlements |
| POST | `/v1/billing/checkout` | `billing:manage` | Crea Stripe Checkout para `plan_key` (incluye 30 días de trial si aún es `INCOMPLETE`) |
| POST | `/v1/billing/confirm-checkout` | `billing:manage` | Verifica `session_id` en Stripe y activa inmediatamente `TRIALING`/`ACTIVE` |
| POST | `/v1/billing/portal` | `billing:manage` | Abre Stripe Billing Portal |
| GET | `/v1/patients` | feature `patients` + `patients:read` | Lista/busca pacientes (`q`, `limit`, `offset`) |
| POST | `/v1/patients` | feature `patients` + `patients:write` | Crea paciente |
| GET | `/v1/patients/{id}` | feature `patients` + `patients:read` | Ficha completa (alertas detalladas redactadas si no tiene `clinical:read`) |
| PATCH | `/v1/patients/{id}` | feature `patients` + `patients:write` | Actualiza datos y alertas (`medical_alerts` requiere `clinical:write`) |
| GET | `/v1/patients/{id}/clinical-records` | feature `clinical_history` + `clinical:read` | Lista evoluciones inmutables y registra acceso clínico |
| POST | `/v1/patients/{id}/clinical-records` | feature `clinical_history` + `clinical:write` | Añade evolución o addenda (`amends_entry_id`) |
| GET | `/v1/patients/{id}/odontograms` | feature `odontogram` + `clinical:read` | Lista odontogramas (`INITIAL`, `CURRENT`, `HISTORICAL`) |
| PUT | `/v1/patients/{id}/odontograms/{type}` | feature `odontogram` + `clinical:write` | Guarda odontograma con control optimista `version` |
| GET | `/v1/users` | `users:manage` | Miembros del tenant |
| POST | `/v1/users` | `users:manage` | Crea usuario y/o membership con rol |
| PATCH | `/v1/users/{membershipId}` | `users:manage` | Cambia rol o estado del miembro |

### Paciente

```json
POST /v1/patients
{
  "first_name": "Ana",
  "last_name": "Pérez",
  "birth_date": "1990-05-01",
  "phone": "600111222",
  "email": "ana@example.test",
  "dni_nie": "12345678Z",
  "gender": "F",
  "whatsapp_opt_in": true,
  "medical_alerts": { "allergies": ["penicilina"], "high_risk": true },
  "address": { "city": "Vilanova i la Geltrú" }
}
```

## Administración global

Requieren `is_platform_admin=true`.

| Método | Ruta | Descripción |
| --- | --- | --- |
| GET | `/v1/admin/tenants` | Tenants + estado de suscripción |
| POST | `/v1/admin/tenants/{id}/status` | `{"status":"ACTIVE|TRIAL|SUSPENDED|CANCELED"}` |
| GET | `/v1/admin/features` | Catálogo de features |
| GET | `/v1/admin/tenants/{id}/features` | Efectivo + overrides del tenant |
| PUT | `/v1/admin/tenants/{id}/features` | `{"feature_key":"...","enabled":true,"expires_at":"opcional RFC3339"}` |
| GET | `/v1/admin/tenants/{id}/domains` | Dominios y estado de provisioning |
| POST | `/v1/admin/tenants/{id}/provision` | Reencola el provisioning del dominio |
| GET | `/v1/admin/plans` | Planes (incluye inactivos y `stripe_price_id`) |
| PUT | `/v1/admin/plans/{key}` | `{"price_monthly_cents":1850,"stripe_price_id":"price_...","is_active":true}` |
| GET | `/v1/admin/leads` | Listado de leads captados (`?status=NEW\|CONTACTED\|...&limit=100`) |
| PATCH | `/v1/admin/leads/{id}` | Actualiza estado del lead (`{"status":"CONTACTED"}`) |

## Códigos de error relevantes

| HTTP | Código | Significado |
| --- | --- | --- |
| 401 | `UNAUTHENTICATED` | Token ausente, inválido o refresh caducado |
| 401 | `INVALID_CREDENTIALS` | Email/contraseña incorrectos |
| 403 | `NO_MEMBERSHIP` | Usuario sin tenant activo |
| 403 | `FORBIDDEN` | Rol sin permiso o no platform admin |
| 402 | `FEATURE_NOT_ENTITLED` | Módulo no incluido o suscripción inactiva |
| 409 | `CONFLICT` | Email o subdominio ya existente |
| 429 | `RATE_LIMITED` | Demasiados intentos |
