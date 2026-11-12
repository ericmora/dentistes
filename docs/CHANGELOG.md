# Changelog de documentación

Registro de cambios ingeridos desde la carpeta de Drive `17YBDTdXQ_okDgXQX4t-fxURrL8xznSWx` y su estabilización en el repositorio.

## 2026-11-12 (Àrea d'Administració de Clínica, Factures Stripe i Cancel·lació)

- **Backend Go (`apps/api`):**
  - Afegits a [`stripeapi.go`](../apps/api/internal/stripeapi/stripeapi.go) `ListInvoices`, `SetCancelAtPeriodEnd` i `CancelSubscriptionNow`.
  - Nous endpoints a [`handlers_billing.go`](../apps/api/internal/httpapi/handlers_billing.go): `GET /v1/billing/invoices`, `POST /v1/billing/cancel`, `POST /v1/billing/resume` (`billing:manage`) i `POST /v1/clinic/cancel` (exclusiu `OWNER`, cancel·la Stripe, tanca el tenant i revoca sessions).
- **SDK i Webapp (`apps/web`):**
  - Nova àrea unificada [`ClinicAdminPage`](../apps/web/src/pages/ClinicAdmin.tsx) (`/settings`, protegida amb `RoleGuard` per a `OWNER` i `ADMIN`) amb pestanyes per a **Facturació i Factures PDF**, **Equip i Rols**, **Gabinets** i **Cancel·lació definitiva del compte** (només `OWNER`).
  - Ampliada [`BillingPage`](../apps/web/src/pages/Billing.tsx) amb descàrrega directa de factures PDF de Stripe i cancel·lació/reactivació de la subscripció.

## 2026-11-12 (Enriquiment DS + F2 Agenda Temps Real SSE + F5 Llista d'Espera Dinàmica)

- **Design System (`@dentistes/ui`):**
  - Afegits tokens de tractament a `tokens.css`, `ConfirmDialog` a `overlays.tsx`, i drag-and-drop natiu a `MultiCabinetTimeline` / `AppointmentCard`.
- **F2 — Agenda Multigabinet en Temps Real:**
  - Hub SSE per tenant (`apps/api/internal/realtime/hub.go`) i stream `GET /v1/appointments/stream` amb heartbeat i reconnexió exponencial (`useAppointmentStream`).
  - Endpoints de `cabinets`, `doctors`, `appointments` amb validació anti-solapament (`409 APPOINTMENT_OVERLAP`) i bloqueig optimista `version`/`If-Match` (`409 VERSION_CONFLICT`).
  - Nova pàgina `AgendaPage` (`/agenda`) a `apps/web` amb creació, arrossegament entre gabinets/hores i canvi d'estat.
- **F5 — Llista d'Espera Dinàmica:**
  - Algorisme de scoring en Go (`ScoreWaitingCandidate`), endpoints `/v1/waiting-list` + `/matches` + `/hold` (bloqueig temporal de 15 minuts).
  - Enllaç directe amb F2: en cancel·lar una cita es retornen i publiquen per SSE els candidats compatibles; nova pàgina `WaitingListPage` (`/waiting-list`).

## 2026-11-12 (Muntatge del Design System + F3 Historial/Alertes + F1 Odontograma)

- **Design System muntat (`apps/web`):** ruta `/design-system` amb el catàleg viu de primitives, overlays i components clínics de `@dentistes/ui`.
- **F3 — Fitxa completa de pacient, Historial Clínic immutable i Alertes JSONB:**
  - Migració [`0007_clinical_immutability_and_audit.sql`](../apps/api/migrations/0007_clinical_immutability_and_audit.sql) amb triggers SQL que impedeixen `UPDATE`/`DELETE` sobre `clinical_records` i taula `clinical_access_logs` amb `FORCE ROW LEVEL SECURITY`.
  - Endpoints `GET/PATCH /v1/patients/{id}` (amb redacció RBAC per a `RECEPTIONIST` / `HYGIENIST` sense `clinical:read`), `GET/POST /v1/patients/{id}/clinical-records` i auditoria d'accessos.
  - UI completa a `PatientDetailPage` (`/patients/:id`) amb `CriticalAlertBanner`, editor d'alertes JSONB i `ClinicalHistoryTimeline` amb addendes.
- **F1 — Odontograma Interactiu FDI:**
  - Endpoints `GET /v1/patients/{id}/odontograms` i `PUT /v1/patients/{id}/odontograms/{type}` amb control optimista de `version` (`409 VERSION_CONFLICT`).
  - Integració d'`OdontogramGrid` (adult 32 / infantil 20, 5 cares SVG, estats generals) a la pestanya d'Odontograma de `PatientDetailPage`.

## 2026-11-12 (Onboarding mínimo con activación Stripe)

- **Backend Go (`apps/api`):**
  - Añadido `POST /v1/public/onboarding` (y alineado `POST /v1/public/signup`) para crear un tenant en pocos campos (`clinic_name`, `subdomain` opcional auto-generado, `cabinets_count`, `locale`, `full_name`, `email`, `password`).
  - Requiere Stripe configurado y precio activo en el plan `base`; crea cliente Stripe y Checkout Session con `trial_period_days=30` y `payment_method_collection=always`, dejando la suscripción en `INCOMPLETE` hasta completar Stripe.
  - Añadido `POST /v1/billing/confirm-checkout` para validar `session_id` al volver de Stripe y activar `TRIALING` (30 días) al instante además del webhook.
- **SDK, Webapp (`apps/web`) y CLI (`apps/cli`):**
  - Añadidos `sdk.onboarding(...)` y `sdk.billing.confirmCheckout(...)` en `@dentistes/sdk`.
  - Creado wizard de 2 pasos en [`Onboarding.tsx`](../apps/web/src/pages/Onboarding.tsx) (`/onboarding` y `/signup`) y pantalla de confirmación [`OnboardingComplete.tsx`](../apps/web/src/pages/OnboardingComplete.tsx) (`/onboarding/complete`), más aviso en `Dashboard.tsx` si la suscripción sigue `INCOMPLETE`.
  - Añadido comando interactivo `dentistes onboarding` en `apps/cli`.
- **Landing y Documentación:** actualizado copy de `apps/marketing` (`0 $ hoy con Stripe`) y documentación (`API.md`, `ARCHITECTURE.md`, `REQUIREMENTS.md`, `README.md`).

## 2026-11-12 (Actualización de producto, DS y leads)

- **Tarifa plana única a 18,50 USD/mes y trial de 30 días:**
  - Nueva migración [`0006_base_plan_and_leads.sql`](../apps/api/migrations/0006_base_plan_and_leads.sql) que añade la feature `digital_signature`, crea/activa el plan `base` (`1850` céntims USD/mes) con todas las funcionalidades del Paquet Base Essencial y desactiva los planes antiguos (`starter`, `clinic`, `enterprise`).
  - `POST /v1/public/signup` asigna el plan `base` con `TRIAL_DAYS=30`.
  - Landing (`apps/marketing`), copy ES/EN/CA, schema JSON-LD y artículos del blog actualizados a **18,50 USD/mes** (`185 USD/año`), add-ons en USD (+20 USD WhatsApp IA, +10 USD Firma digital, 39 USD Pack Completo) y 0 $ de alta.
  - **Nota sobre Drive:** los documentos en `docs/drive/` conservan las cifras anteriores (`39 €/29 $/590 MXN`) hasta actualizar los documentos fuente en Google Drive.
- **Endpoint de captación de leads:**
  - Añadida tabla `leads` en PostgreSQL y endpoints `POST /v1/public/leads` (público, rate-limited, con soporte de UTM), `GET /v1/admin/leads` y `PATCH /v1/admin/leads/{id}`.
  - Añadidos tipos y métodos en `@dentistes/sdk`, pestaña de gestión de leads en `apps/admin` y envío directo de solicitudes de demo desde `CtaForm` en `apps/marketing`.
  - Añadido origen de marketing (`https://dentistes.2mes4.com`) a `CORS_ORIGINS` en `deploy/k3s/base/configmap.yaml`.
- **Design System (`@dentistes/ui`):**
  - Ampliado `packages/ui` con primitivas (`NumberInput`, `CurrencyInput`, `Textarea`, `Select`, `Combobox`, `Checkbox`, `Switch`, `RadioGroup`, `Modal`, `Sheet`, `Tooltip`, `DropdownMenu`, `Tabs`, `Skeleton`, `ToastProvider`) y componentes clínicos (`CriticalAlertBanner`, `ToothSurfaceRenderer`, `OdontogramGrid`, `AppointmentCard`, `MultiCabinetTimeline`, `WaitingListCandidateCard`, `ClinicalHistoryTimeline`, `InvoiceLineEditor`, `QRVerifierBlock`, `RoleGuard`).
  - Integrado stack completo en `apps/web` (`@tanstack/react-query`, `zustand`, `react-hook-form`, `zod`, `lucide-react`) y refactorizada la vista `Patients` usando el DS.
- **Documentación corregida:** actualizados `docs/API.md` (eliminada referencia obsoleta a 14 días de trial y documentados leads + plan `base`), `docs/ARCHITECTURE.md`, `docs/REQUIREMENTS.md` y `README.md`.

## 2026-11-12

### Implementación del sitio público

- Landing, blog y legales en ES/EN/CA con prerender de 24 rutas + `404.html`, sitemap con alternates, robots con AI crawlers, `llms.txt` y feeds RSS por idioma.
- SEO: canonical, hreflang, OG localizada, Twitter Card, JSON-LD, un H1 por página y enlaces internos localizados.
- Assets: OG PNG 1200×630 por idioma, portadas WebP neutras, favicon, iconos PWA y manifest.
- Nginx estático: `try_files` con 404 real, caché inmutable para assets, `no-cache` para HTML y cabeceras de seguridad.
- Docker de marketing simplificado; ya no compila el SDK. Imagen construida y servida localmente.
- Trial alineado a 30 días en API, entorno, K8s, README y signup. Signup prellena `tenant_name`, `contact_name`, `email` y `subdomain` desde la landing.
- Lighthouse local de la home ES: Performance 100, Accessibility 100, Best Practices 100, SEO 100.
- Plan de contenidos SEO/GEO en `docs/seo/content-plan.md`, sin métricas inventadas y con GSC pendiente de credenciales.
- Desplegado en producción el 2026-11-12: API, web, admin y marketing con 2 réplicas Ready. Marketing sirve HTML prerenderizado, `/en/` y `/ca/` responden y el 404 es real.
- Corregido el deploy: marketing recibe `VITE_APP_URL` de la app (no del dominio público) y el script fuerza `rollout restart` para recoger el nuevo `:latest`.
- Separadas las configs Nginx: `spa.conf` para web/admin (fallback SPA, `/signup` 200) y `static.conf` para marketing (404 real, caché de assets).
- Lighthouse de producción: Performance 100, Accessibility 100, Best Practices 100, SEO 100.


### Nuevos documentos (7)

| Documento | Tipo | Impacto |
| --- | --- | --- |
| `Producte/Disseny Landing Page - Software Dental.md` | new | Define la arquitectura, el copy y los CTA de la nueva landing pública. Implementada en `apps/marketing` (RQ-021, RQ-027). |
| `Producte/Especificació Funcional - Paquet Base Essencial.md` | new | Fija el alcance del plan base y sus exclusiones (RQ-023). |
| `Producte/Estratègia d'Inversió en Màrqueting Progressiva.md` | new | Define gates de CAC, payback, conversión y el presupuesto progresivo (RQ-024). |
| `Producte/Estratègia de Preus - Software Dental.md` | new | Nueva tarifa plana de 39 €/29 $/590 MXN, add-ons y pack completo (RQ-022). Detectada divergencia con `plans`/Stripe. |
| `Producte/Anàlisi de Competidors - Software Dental.md` | new | Base del posicionamiento y de la matriz de contraste de la landing (RQ-026). |
| `Producte/Plantilla Formulari Feedback Clíniques Pilot.md` | new | Formulario operativo para la fase piloto, sin impacto de código (RQ-025). |
| `Producte/Pla Financer i Màrqueting 3 Anys - Software Dental.csv` | new | Export vacío (0 bytes) en Drive; no se pudo ingerir contenido financiero. Se mantiene la referencia y se avisará si se vuelve a sincronizar con datos. |

### Decisiones y notas

- La landing pública pasa a ser estática y prerenderizada para SEO; los precios se muestran desde el documento de estrategia, no desde `/v1/public/plans`.
- **Abierto**: la base de datos y Stripe conservan los planes antiguos (Starter 99 €, Clinic 199 €, Enterprise 349 €). No se tocó billing para no tomar una decisión de producto irreversible. Hay que definir el mapeo de la tarifa plana y los add-ons antes de publicar precios con checkout.
- **Abierto**: el CSV del plan financiero está vacío en Drive; no se estabilizaron cifras financieras.
- La prueba gratuita se alinea a 30 días por defecto (`TRIAL_DAYS=30`) con el copy de la landing y el signup.

### Documentos ya reflejados previamente (13)

`README - Software Gestió Dental`, `ADRs/ADR-001`, `ADRs/ADR-002`, `Arquitectura/Arquitectura Overview`, `Arquitectura/Arquitectura de Frontend i Design System`, `Arquitectura/Model de Dades`, `Producte/Funcionalitats de Producte`, `Producte/F1`, `Producte/F2`, `Producte/F3`, `Producte/F4`, `Producte/F5`, `Producte/F6`. Se releyeron para el ciclo y siguen cubiertos por RQ-001..RQ-020.
