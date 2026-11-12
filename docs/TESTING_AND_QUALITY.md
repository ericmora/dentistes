# Regles de Qualitat, TDD i Camins Crítics — Dentistes

Aquest document estableix les regles de qualitat d'enginyeria d'obligat compliment per a qualsevol desenvolupament al projecte **Dentistes**.

## 1. Regla d'Or: Cobertura i TDD (Test-Driven Development)

1. **Cap codi de producció sense tests:**
   - La lògica de domini, seguretat, autorització (RBAC), multi-tenancy (RLS) i integració externa (Stripe, K8s) ha de comptar amb una cobertura del 100% en unitat i camins crítics.
2. **Cicle TDD estricte en 3 fases:**
   - **Fase 1 (Definició i Camins Crítics):**
     - Identificar els **camins crítics (critical paths)** de la funcionalitat abans d'escriure codi de producció.
     - Definir el set de dades de prova determinista (fixtures).
     - Escriure els tests E2E / integració dels camins crítics que fallin d'entrada (**Fase Red**).
   - **Fase 2 (Desenvolupament guiat per tests):**
     - Implementar el codi de producció mínim necessari per fer passar els tests (**Fase Green**).
     - Afegir tests unitaris exhaustius per a totes les ramificacions i casos límit.
   - **Fase 3 (Refactorització i Validació de Tancament):**
     - Netejar el codi mantenint la suite en verd (**Fase Refactor**).
     - Executar la bateria completa de verificació (`go test -cover ./...`, `pnpm run check`, tests d'integració).
     - Requisit de sortida: 100% de tests aprovats i cobertura validada.

## 2. Camins Crítics del SaaS Dentistes

Els camins crítics de l'aplicació han de tenir sempre cobertura de tests E2E / integració:

1. **Camí Crític 1: Onboarding Clínic i Subscripció de Prova (Trial 30 dies):**
   - Registre de clínica (`POST /v1/public/onboarding`) -> creació de Tenant, Gabinets, Owner, Stripe Customer i sessió de Checkout amb 30 dies gratuïts i captura de targeta.
   - Confirmació de checkout / Webhook `checkout.session.completed` -> subscripció passa a `TRIALING` i s'activen les llicències.
2. **Camí Crític 2: Autenticació, Multi-Tenancy (RLS) i Matriu RBAC:**
   - Login (`POST /v1/auth/login`) -> emissió de JWT i cookie de refresc HttpOnly.
   - Aïllament multi-tenant: cap tenant pot veure dades d'un altre sota cap circumstància.
   - RBAC estricte: `OWNER`, `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `ASSISTANT`. Els intents d'accés no autoritzats retornen `403 FORBIDDEN`.
3. **Camí Crític 3: Agenda Multigabinet en Temps Real (F2):**
   - Creació i gestió de cites multigabinet.
   - Detecció i bloqueig immediat de solapaments (`409 APPOINTMENT_OVERLAP`).
   - Concurrència optimista amb bloqueig de versió `If-Match` (`409 VERSION_CONFLICT`).
   - Emissió en temps real via Server-Sent Events (SSE) aïllada per tenant.
4. **Camí Crític 4: Llista d'Espera Dinàmica i Priorització d'Urgències (F5):**
   - Inserció amb nivells d'urgència (1-5) i preferències d'horari/doctor.
   - Algorisme de matching automàtic davant forats a l'agenda.
   - Promoció d'entrada de llista d'espera a cita confirmada.
5. **Camí Crític 5: Cicle de Facturació, Webhooks Stripe i Cancel·lació de Compte:**
   - Gestió dels 11 esdeveniments de webhook de Stripe.
   - Bloqueig immediat de features (`402 PAYMENT_REQUIRED`) en impagament (`PAST_DUE`) o pausa (`PAUSED`).
   - Descàrrega de factures PDF.
   - Cancel·lació definitiva de clínica (`POST /v1/clinic/cancel`): exclusiu per a l'Owner, cancel·lació a Stripe, tancament del tenant i revocació de totes les sessions.
6. **Camí Crític 6: Captació de Leads Pública:**
   - Validació i emmagatzematge segur de contactes comercials (`POST /v1/public/leads`).

## 3. Estratègia d'Entorns de Prova

- **Local / CI (Automatitzat, ràpid i hermètic):**
  - Tots els tests unitaris, d'integració i E2E de desenvolupament s'executen en local amb bases de dades aïllades i servidors mock de Stripe.
  - Temps d'execució < 10 segons, zero cost de xarxa i determinisme absolut.
- **Testing Namespace K8s (`dentistes-qa`) + Wildcard Test Domain:**
  - S'utilitza com a entorn d'Staging / QA integrat per validar certificats Let's Encrypt Staging, Ingress Controller real de Kubernetes, cookies HTTPS multi-subdomini i recepció de webhooks de Stripe Test en directe.
