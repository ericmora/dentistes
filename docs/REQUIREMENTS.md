# Requisitos y trazabilidad

Estado de la base respecto a la documentación de Google Drive (carpeta `17YBDTdXQ_okDgXQX4t-fxURrL8xznSWx`).

| ID | Requisito | Fuente | Estado |
| --- | --- | --- | --- |
| RQ-001 | Aislamiento multi-tenant por fila con PostgreSQL RLS | `ADRs/ADR-001 Multi-Tenancy RLS.md` (2026-11-11) | Implementado: `FORCE RLS`, contexto por transacción, rol runtime sin privilegios |
| RQ-002 | Esquema PostgreSQL 16 para clínica, agenda, odontograma, facturación y WhatsApp | `Arquitectura/Model de Dades - Especificació PostgreSQL 16+.md` (2026-11-11) | Esquema completo en migraciones; endpoints de negocio pendientes por módulo |
| RQ-003 | Backend Go stateless con bajo consumo | `Arquitectura/Arquitectura Overview.md` (2026-11-11) | Implementado: Go 1.24, chi, pgx, JWT |
| RQ-004 | RBAC por rol (ADMIN, DENTIST, HYGIENIST, RECEPTIONIST) | `Arquitectura/Arquitectura Overview.md` (2026-11-11) | Implementado con `OWNER` añadido para el tenant; matriz en `internal/auth/roles.go` |
| RQ-005 | Gestión segura de usuarios multi-tenant | Requisito de producto | Implementado: Argon2id, JWT, refresh rotado, sesiones, bloqueo por usuario/tenant |
| RQ-006 | Frontend React 18 + Vite + Tailwind + design system | `Arquitectura/Arquitectura de Frontend i Design System.md` (2026-11-11) | Base implementada: tokens, componentes, gates y tres apps web |
| RQ-007 | App móvil, CLI, webapp y admin global | Requisito de producto | Scafolds funcionales: Expo, CLI Node, web y admin |
| RQ-008 | Web comercial con precios | Requisito de producto | Implementada: landing + precios desde API + CTA a signup |
| RQ-009 | SDK JS conector para interfaces | Requisito de producto | Implementado: `@dentistes/sdk` tipado con auth, refresh, features, pacientes, billing y admin |
| RQ-010 | Permisos por tenant según features contratadas | Requisito de producto | Implementado: planes, `plan_features`, overrides, suscripción y gates 402/403 |
| RQ-011 | Cobros integrados y bloqueo automático por impago | Requisito de producto | Implementado: Stripe Checkout/Portal/webhooks y bloqueo por estado de suscripción |
| RQ-012 | Despliegue en k3s (`../host`) | Requisito de producto | Implementado: Kustomize, Traefik/cert-manager, NetworkPolicies, registry privado |
| RQ-013 | Backups de base de datos con copia | Requisito de producto | Implementado: CronJob pg_dump + retención + rclone opcional; destino offsite pendiente de decidir |
| RQ-014 | WhatsApp/Mastra como servicio separado | `ADRs/ADR-002 Automatització WhatsApp Mastra.md` (2026-11-11) | Esquema y feature listos; servicio y agente pendientes (F4) |
| RQ-015 | F1 Odontograma interactivo | `Producte/F1 - Odontograma Interactiu - Especificació Tècnica.md` (2026-11-11) | Esquema `odontograms` listo; UI y endpoints pendientes |
| RQ-016 | F2 Agenda multigabinet en tiempo real | `Producte/F2 - Agenda Multigabinet en Temps Real - Especificació Tècnica.md` (2026-11-11) | Esquema `cabinets`/`appointments` listo; SSE/UI pendientes |
| RQ-017 | F3 Historial médico con alertas JSONB | `Producte/F3 - Historial Mèdic amb Alertes JSONB - Especificació Tècnica.md` (2026-11-11) | Esquema `clinical_records` + alertas JSONB/GIN listos; endpoints pendientes |
| RQ-018 | F5 Lista de espera dinámica | `Producte/F5 - Llista d'Espera Dinàmica - Especificació Tècnica.md` (2026-11-11) | Esquema listo; scoring y holds pendientes |
| RQ-019 | F6 Facturación PDF con QR | `Producte/F6 - Facturació PDF amb QR - Especificació Tècnica.md` (2026-11-11) | Esquema `invoices`/`payments` listo; PDF/QR pendientes |

## Notas de implementación

- La autenticación se implementa sin Firebase (ADR-0001) y con usuarios globales + memberships (ADR-0002).
- La capa de features/entitlements complementa el RBAC documentado (ADR-0003).
- El primer slice vertical implementado es `patients` (feature + permisos + RLS + SDK + UI).
- Las migraciones son la fuente de verdad del esquema; cualquier cambio documental debe reflejarse aquí y en `docs/CHANGELOG.md`.
