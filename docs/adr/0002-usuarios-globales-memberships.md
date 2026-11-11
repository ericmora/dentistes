# ADR 0002: Usuarios globales y memberships por tenant

## Contexto

El modelo de datos de referencia define `users.tenant_id`, lo que obliga a duplicar cuentas por clínica. El producto necesita profesionales que trabajen en varias clínicas y un administrador global de plataforma.

## Decisión

- `users` es global (email único).
- `memberships(tenant_id, user_id, role)` define la pertenencia y el rol por tenant.
- `users.is_platform_admin` identifica al administrador global.
- `sessions` guarda el tenant activo de cada refresh token.

## Consecuencias

- Positivas: una cuenta por persona, cambio de tenant sin duplicar credenciales, platform admin limpio, RLS sigue aplicando a `memberships` y al resto de tablas.
- Negativas: el login debe resolver el tenant activo y las queries de membership necesitan contexto de usuario antes de fijar tenant.
- Mitigación: política RLS específica en `memberships` que permite `user_id = app.current_user_id` y `tenant_id = app.current_tenant_id`.
