# ADR 0001: Autenticación propia en lugar de Firebase Auth

## Contexto

La arquitectura de referencia propone Firebase Auth con MFA y custom claims. El proyecto prioriza soberanía de datos, despliegue on-premise y ausencia de dependencias gestionadas externas.

## Decisión

Implementar autenticación propia en el backend Go:

- contraseñas con Argon2id;
- access tokens JWT HS256 de corta duración;
- refresh tokens opacos, hasheados y rotados, almacenados en PostgreSQL;
- sesiones revocables por usuario;
- base preparada para añadir TOTP/MFA sin cambiar el modelo de sesión.

## Consecuencias

- Positivas: control total del dato, sin dependencia de Firebase, coste cero por MAU, integración directa con memberships multi-tenant.
- Negativas: hay que construir verificación de email, recuperación de contraseña, MFA y políticas de bloqueo por intentos.
- Mitigación: la superficie actual (login/refresh/logout) está cubierta con Argon2id, rotación y rate limit básico; las piezas restantes están en el roadmap de hardening.
