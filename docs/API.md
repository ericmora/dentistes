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
| POST | `/v1/public/signup` | Alta de tenant + owner + trial 14 días |
| POST | `/v1/auth/login` | Login; devuelve access token y memberships |
| POST | `/v1/auth/refresh` | Rota refresh token y emite access token |
| POST | `/v1/auth/logout` | Revoca la sesión |
| POST | `/v1/webhooks/stripe` | Webhook de Stripe (firma obligatoria) |

### Signup

```json
POST /v1/public/signup
{
  "tenant_name": "Clínica Dental Example",
  "subdomain": "example",
  "full_name": "Ana Owner",
  "email": "ana@example.test",
  "password": "minimo-10-caracteres"
}
```

Crea tenant `TRIAL`, usuario, membership `OWNER` y suscripción `TRIALING` con plan `starter`.

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
| POST | `/v1/billing/checkout` | `billing:manage` | Crea Stripe Checkout para `plan_key` |
| POST | `/v1/billing/portal` | `billing:manage` | Abre Stripe Billing Portal |
| GET | `/v1/patients` | feature `patients` + `patients:read` | Lista/busca pacientes (`q`, `limit`, `offset`) |
| POST | `/v1/patients` | feature `patients` + `patients:write` | Crea paciente |
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
| GET | `/v1/admin/plans` | Planes (incluye inactivos y `stripe_price_id`) |
| PUT | `/v1/admin/plans/{key}` | `{"price_monthly_cents":19900,"stripe_price_id":"price_...","is_active":true}` |

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
