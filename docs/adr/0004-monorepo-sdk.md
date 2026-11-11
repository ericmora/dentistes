# ADR 0004: Monorepo con apps desacopladas por el SDK

## Contexto

El producto debe cubrir webapp, admin global, web comercial, móvil y CLI con un backend Go y un modelo de permisos común.

## Decisión

Un monorepo pnpm con:

- `apps/api` (Go) como única fuente de verdad de negocio;
- `packages/sdk` como contrato tipado entre API y clientes;
- `packages/ui` con tokens y componentes compartidos;
- apps React/Vite independientes, Expo para móvil y Node para CLI;
- despliegue separado de API y frontends estáticos en K3s.

## Consecuencias

- Positivas: cambios de contrato en un solo sitio, builds independientes, despliegues granulares, DX compartida.
- Negativas: el pipeline debe construir varios artefactos y mantener versiones alineadas.
- Mitigación: scripts raíz (`pnpm run build`, `pnpm run check`) y un `deploy.sh` que construye todas las imágenes con el mismo tag.
