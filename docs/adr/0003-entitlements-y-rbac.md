# ADR 0003: Entitlements por plan + RBAC por rol

## Contexto

El RBAC documentado responde a “quién puede hacer qué”. El modelo de negocio necesita además “qué funcionalidades ha contratado cada tenant” y bloquearlas automáticamente si no se paga.

## Decisión

Dos capas independientes y combinadas en middleware:

1. **Entitlements**: `features`, `plans`, `plan_features`, `tenant_features` y `subscriptions`. Solo `ACTIVE`/`TRIALING` vigente habilita el plan; los overrides por tenant permiten addons o desactivaciones con expiración.
2. **RBAC**: mapa estático de permisos por rol (`patients:read`, `clinical:write`, `billing:manage`, …).

Los endpoints de módulo aplican `requireFeature(...)` y después `requirePermission(...)`.

## Consecuencias

- Positivas: upgrades/downgrades sin tocar código, bloqueo inmediato por impago, UI capaz de mostrar módulos bloqueados y CTAs.
- Negativas: dos fuentes de autorización que deben auditarse juntas; los tests deben cubrir ambas.
- Mitigación: `GET /v1/me` devuelve ambos mapas y los gates del SDK/UI usan exactamente esa respuesta; tests unitarios de entitlements y matriz de roles.
