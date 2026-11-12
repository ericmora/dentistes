# Instruccions d'Enginyeria i Regles per a Agents (Dentistes)

Qualsevol agent d'IA que operi en aquest repositori ha de seguir obligatòriament els següents principis de qualitat i desenvolupament:

## 1. Desenvolupament Guiat per Tests (TDD) i Camins Crítics

1. **Definició Prèvia dels Camins Crítics:**
   - En iniciar el desenvolupament de qualsevol funcionalitat (feature), és obligatori identificar els seus **camins crítics (critical paths)**.
   - Abans d'escriure codi de producció, cal preparar el conjunt de dades de prova (fixtures) i implementar els tests E2E / integració dels camins crítics (fase Red de TDD).
2. **Objectiu de Cobertura 100%:**
   - La lògica de negoci, permisos RBAC, multi-tenancy RLS, integracions (Stripe, K8s) i utilitats han de comptar amb el 100% de cobertura en tests unitaris.
3. **Validació al Final de Desenvolupament:**
   - Abans de finalitzar la tasca o sincronitzar el treball, s'han d'executar tots els tests unitaris i E2E:
     ```bash
     cd apps/api && go vet ./... && go test -cover ./...
     pnpm run check
     ```
   - Cap tasca es dóna per bona si falla algun test o la cobertura no s'ha mantingut/millorat.

## 2. Entorns de Prova

- **Local:** Per a l'execució diària de TDD, CI i tests automatitzats hermètics.
- **K8s Testing Namespace (`dentistes-qa`) + Wildcard Test Domain:** Per a proves d'integració reals de provisionament Ingress, certificats TLS i webhooks externs.

Consulteu [`docs/TESTING_AND_QUALITY.md`](./docs/TESTING_AND_QUALITY.md) per a la descripció detallada de cada camí crític.
