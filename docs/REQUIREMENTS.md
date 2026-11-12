# Requisitos y trazabilidad

Estado de la base respecto a la documentación de Google Drive (carpeta `17YBDTdXQ_okDgXQX4t-fxURrL8xznSWx`).

| ID | Requisito | Fuente | Estado |
| --- | --- | --- | --- |
| RQ-001 | Aislamiento multi-tenant por fila con PostgreSQL RLS | `ADRs/ADR-001 Multi-Tenancy RLS.md` (2026-11-11) | Implementado: `FORCE RLS`, contexto por transacción, rol runtime sin privilegios |
| RQ-002 | Esquema PostgreSQL 16 para clínica, agenda, odontograma, facturación y WhatsApp | `Arquitectura/Model de Dades - Especificació PostgreSQL 16+.md` (2026-11-11) | Esquema completo en migraciones; endpoints de negocio pendientes por módulo |
| RQ-003 | Backend Go stateless con bajo consumo | `Arquitectura/Arquitectura Overview.md` (2026-11-11) | Implementado: Go 1.24, chi, pgx, JWT |
| RQ-004 | RBAC por rol (ADMIN, DENTIST, HYGIENIST, RECEPTIONIST) | `Arquitectura/Arquitectura Overview.md` (2026-11-11) | Implementado con `OWNER` añadido para el tenant; matriz en `internal/auth/roles.go` |
| RQ-005 | Gestión segura de usuarios multi-tenant | Requisito de producto | Implementado: Argon2id, JWT, refresh rotado, sesiones, bloqueo por usuario/tenant, endpoints y UI de miembros/roles |
| RQ-006 | Frontend React 18 + Vite + Tailwind + design system | `Arquitectura/Arquitectura de Frontend i Design System.md` (2026-11-11) | Implementado en `packages/ui` (tokens, primitivas, overlays, gates y componentes clínicos F1–F6) y cableado en `apps/web` (`@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `lucide-react`) |
| RQ-007 | App móvil, CLI, webapp y admin global | Requisito de producto | Scafolds funcionales: Expo, CLI Node, web y admin |
| RQ-008 | Web comercial con precios | Requisito de producto | Reemplazada por RQ-021: landing SEO estática con tarifa plana única (18,50 USD/mes) y CTA a signup/leads |
| RQ-009 | SDK JS conector para interfaces | Requisito de producto | Implementado: `@dentistes/sdk` tipado con auth, refresh, features, pacientes, leads, billing y admin |
| RQ-010 | Permisos por tenant según features contratadas | Requisito de producto | Implementado: planes, `plan_features`, overrides, suscripción y gates 402/403 |
| RQ-011 | Cobros integrados y bloqueo automático por impago | Requisito de producto | Implementado: Stripe Checkout/Portal/webhooks y bloqueo por estado de suscripción |
| RQ-012 | Despliegue en k3s (`../host`) | Requisito de producto | Implementado: Kustomize, Traefik/cert-manager, NetworkPolicies, registry privado |
| RQ-013 | Backups de base de datos con copia | Requisito de producto | Implementado: CronJob pg_dump + retención + rclone opcional; destino offsite pendiente de decidir |
| RQ-014 | Provisioning automático de tenant: registro, dominio, Ingress y TLS | Requisito de producto | Implementado: `tenant_domains`, worker K8s, RBAC y cert-manager |
| RQ-015 | WhatsApp/Mastra como servicio separado | `ADRs/ADR-002 Automatització WhatsApp Mastra.md` (2026-11-11) | Esquema y feature listos; servicio y agente pendientes (F4) |
| RQ-016 | F1 Odontograma interactivo | `Producte/F1 - Odontograma Interactiu - Especificació Tècnica.md` (2026-11-11) | Esquema `odontograms` listo; UI y endpoints pendientes |
| RQ-017 | F2 Agenda multigabinet en tiempo real | `Producte/F2 - Agenda Multigabinet en Temps Real - Especificació Tècnica.md` (2026-11-11) | Esquema `cabinets`/`appointments` listo; SSE/UI pendientes |
| RQ-018 | F3 Historial médico con alertas JSONB | `Producte/F3 - Historial Mèdic amb Alertes JSONB - Especificació Tècnica.md` (2026-11-11) | Esquema `clinical_records` + alertas JSONB/GIN listos; endpoints pendientes |
| RQ-019 | F5 Lista de espera dinámica | `Producte/F5 - Llista d'Espera Dinàmica - Especificació Tècnica.md` (2026-11-11) | Esquema listo; scoring y holds pendientes |
| RQ-020 | F6 Facturación PDF con QR | `Producte/F6 - Facturació PDF amb QR - Especificació Tècnica.md` (2026-11-11) | Esquema `invoices`/`payments` listo; PDF/QR pendientes |
| RQ-021 | Landing pública de captación con arquitectura, copy, CTA de prueba y demo | `Producte/Disseny Landing Page - Software Dental.md` (2026-11-12) | Implementada en `apps/marketing`: narrativa, mockups, prerender SEO, JSON-LD, sitemap/robots, signup prellenado y solicitud de demo conectada a `POST /v1/public/leads` + panel en `apps/admin`. Pendiente: reserva automática de franja en calendario |
| RQ-022 | Tarifa plana única por clínica: 18,50 USD/mes (anual 185 USD/año, 2 meses gratis); usuarios y pacientes ilimitados; 0 $ de alta; sin permanencia; add-ons opcionales (+20 USD WhatsApp IA, +10 USD Firma Digital, Pack 39 USD) | Actualización de producto (2026-11-12) y `Producte/Estratègia de Preus - Software Dental.md` | Implementado en `apps/marketing`, `0006_base_plan_and_leads.sql` (plan `base` a `1850` céntimos USD y planes antiguos desactivados) y `POST /v1/public/signup`. Pendiente: ejecutar `stripe-sync.sh` en Stripe y actualizar los documentos fuente en Google Drive (`39 €/29 $` → `18,50 USD`) |
| RQ-023 | Alcance funcional del Paquete Base Esencial (agenda multigabinete, historial con alertas, odontograma, facturación fiscal, recordatorios básicos) y exclusión de IA WhatsApp y firma biométrica | `Producte/Especificació Funcional - Paquet Base Essencial.md` (2026-11-12) | Cubierto por RQ-016..RQ-020 y mostrado en la landing; UI/endpoints de módulos siguen pendientes |
| RQ-024 | Inversión de marketing progresiva con gates: CAC <= 100 €, payback <= 3,5 meses, conversión demo/cliente >= 15 %, churn <= 2 %, presupuesto inicial 500 €/mes | `Producte/Estratègia d'Inversió en Màrqueting Progressiva.md` (2026-11-12) | Operativo, sin código. Pending: instrumentar UTM/eventos de conversión |
| RQ-025 | Formulario de feedback de clínicas piloto (6 secciones, 15 preguntas) | `Producte/Plantilla Formulari Feedback Clíniques Pilot.md` (2026-11-12) | Pendiente de trasladar a Google Forms; no requiere código de producto |
| RQ-026 | Mensaje de posicionamiento y matriz de contraste frente a Gesden, XDentalCloud, Clinic Cloud, Docfav, Dentalink, Dentidesk y Doctocliq | `Producte/Anàlisi de Competidors - Software Dental.md` (2026-11-11) | Aplicado a la sección de contraste de la landing; revisar claims antes de publicar |
| RQ-027 | La landing debe cumplir buenas prácticas SEO: contenido en HTML prerenderizado, metadatos, canonical, Open Graph, JSON-LD, sitemap, robots, semántica y rendimiento | Solicitud de usuario (2026-11-11) | Implementado en `apps/marketing` con build SSR/prerender. Lighthouse local y de producción (home ES, Chrome headless): Performance 100, Accessibility 100, Best Practices 100, SEO 100. |
| RQ-028 | La prueba gratuita pública es de 30 días y requiere completar Stripe Checkout ($0 hoy) | Actualización de producto (2026-11-12) | Implementado en `POST /v1/public/onboarding` / `/signup`, `POST /v1/billing/confirm-checkout`, `apps/web` (`/onboarding`, `/onboarding/complete`), CLI `dentistes onboarding` y copy de landing |

## Notas de implementación

- La autenticación se implementa sin Firebase (ADR-0001) y con usuarios globales + memberships (ADR-0002).
- La capa de features/entitlements complementa el RBAC documentado (ADR-0003).
- El primer slice vertical implementado es `patients` (feature + permisos + RLS + SDK + UI).
- Las migraciones son la fuente de verdad del esquema; cualquier cambio documental debe reflejarse aquí y en `docs/CHANGELOG.md`.
