# ADR 0005: Provisioning automático de tenants con Ingress y cert-manager

## Contexto

Un tenant nuevo necesita un host propio, un certificado TLS y un Ingress que lo enrute a la webapp. Hacerlo a mano no escala y es propenso a errores.

## Decisión

- El signup crea el tenant y su dominio primario en `tenant_domains` dentro de la misma transacción.
- Un worker en la API reclama dominios pendientes con `FOR UPDATE SKIP LOCKED` y crea un Ingress determinista `tenant-<subdominio>`.
- El Ingress enruta al servicio `web` y lleva la anotación `cert-manager.io/cluster-issuer`; cert-manager emite el certificado Let's Encrypt por host y guarda el secret `tenant-<subdominio>-tls`.
- Estados en BD (`PENDING`, `PROVISIONING`, `READY`, `FAILED`) con intentos y backoff.
- La API usa un ServiceAccount con Role limitado a Ingresses en su namespace.

## Consecuencias

- Positivas: alta automática, aislamiento de permisos, certificados gestionados, reintentos idempotentes, trazabilidad en BD.
- Negativas: dependencia de DNS wildcard y de cert-manager con HTTP-01; un certificado wildcard evitaría emisiones por tenant pero requiere DNS-01.
- Mitigación: el panel global muestra estado y permite reprovisionar; `api provision` permite forzar una pasada.
