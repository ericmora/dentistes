# Plan de contenidos SEO/GEO — Dentistes

Fecha: 2026-11-12
Estado: plan de trabajo. Sin métricas de tráfico inventadas.

## 1. Límites y fuentes

- Google Search Console **no está disponible** en este entorno: falta `GSC_KEY_FILE` o configurar OAuth. No hay volúmenes, CTR ni posiciones reales.
- Este plan se basa en:
  - `Producte/Anàlisi de Competidors - Software Dental.md` (2026-11-11).
  - `Producte/Disseny Landing Page - Software Dental.md` (2026-11-11).
  - `Producte/Estratègia d'Inversió en Màrqueting Progressiva.md` (2026-11-11).
  - `docs/REQUIREMENTS.md` (RQ-021 a RQ-028).
  - Contenido ya publicado en `apps/marketing/src/content/posts/`.
- Las hipótesis de demanda se validan con GSC, Google Ads y conversaciones con clínicas. Hasta entonces, se marcan como hipótesis, no como datos.
- No se publican claims de cumplimiento fiscal, certificaciones, número de clientes, testimonios ni ahorros garantizados sin evidencia interna.

## 2. ICP y promesa

**ICP principal:** clínica dental independiente de 2 a 8 personas, 1-3 gabinetes, en España (Garraf/Penedès y área metropolitana de Barcelona) o LATAM (México, Chile, Colombia), con recepción propia y software heredado caro o rígido.

**Dolor:** la cuota sube con cada profesional, los módulos se cobran aparte, la migración da miedo y la recepción pierde tiempo entre agenda, historial y facturación.

**Promesa:** una cuota plana por clínica, usuarios y pacientes ilimitados, migración asistida y datos en la UE. 30 días de prueba sin tarjeta.

**Ángulo editorial:** decisiones prácticas para una clínica pequeña, no teoría de gestión. Comparativas honestas, checklists y cálculos que el lector puede rehacer.

## 3. Clústeres y prioridad

| Prioridad | Clúster | Intención | Posts existentes | Nuevos |
|---|---|---|---|---|
| 1 | Coste y elección | Comparar, calcular, decidir | `choose-software`, `cost` | 3 |
| 1 | Migración y salida | Reducir riesgo percibido | `migration` | 2 |
| 2 | Operaciones de recepción | Mejorar agenda y pacientes | — | 3 |
| 2 | Confianza y datos | RGPD, seguridad, proveedor | — | 2 |
| 3 | LATAM | Precio y migración local | — | 2 |

## 4. Calendario de 12 semanas

Cadencia realista: **1 pieza nueva por semana**, publicada en ES/EN/CA, más una actualización quincenal de un post existente. Una pieza puede ser artículo, comparativa o checklist; no se publica contenido thin solo para llenar el calendario.

| Semana | Pieza | Clúster | Formato | CTA |
|---|---|---|---|---|
| 1 | Checklist de migración de datos de una clínica dental | Migración | Checklist + plantilla | Prueba / migración |
| 2 | Software dental por usuario vs tarifa plana: coste a 3 años | Coste | Tabla + calculadora manual | Precios |
| 3 | Alternativas a Gesden para una clínica pequeña: qué comparar | Coste | Comparativa por criterios | Demo / precios |
| 4 | Cómo limpiar duplicados de pacientes antes de migrar | Migración | Guía operativa | Prueba |
| 5 | Agenda multigabinete: reducir huecos sin saturar recepción | Operaciones | Guía + mini caso | Producto |
| 6 | Lista de espera dinámica: cómo usarla sin perder pacientes | Operaciones | Guía + flujo | Producto |
| 7 | Recordatorios de cita: WhatsApp, SMS o llamada | Operaciones | Comparativa de canal | WhatsApp add-on |
| 8 | RGPD en clínica dental: 12 preguntas al proveedor | Confianza | Checklist legal | Seguridad |
| 9 | Datos de pacientes en la UE: RLS, backups y accesos | Confianza | Explicación técnica | Seguridad |
| 10 | Software dental en México: coste por doctor vs tarifa plana | LATAM | Comparativa MXN/USD | Precios MX |
| 11 | Migrar desde Dentalink: qué exportar y qué validar | LATAM | Checklist | Prueba |
| 12 | Odontograma: qué debe registrar y qué no | Operaciones | Guía clínica | Producto |

Notas:
- La comparativa con Gesden/Dentalink usa datos públicos y la fecha de consulta; no afirma defectos no verificados. Se revisa antes de publicar.
- La pieza de RGPD no es asesoramiento legal; incluye aviso y fuentes.
- La pieza fiscal (VeriFactu/TicketBAI/CFDI) queda **fuera** hasta confirmar el estado real del producto y validarlo con producto/legal.

## 5. Especificación por pieza

Cada artículo debe entregar:

1. **Respuesta directa** en las primeras 80-120 palabras.
2. **TL;DR** de 3-5 puntos o tabla.
3. **Desarrollo** con ejemplos numéricos verificables.
4. **Checklist accionable** o plantilla.
5. **FAQ** de 3-6 preguntas reales.
6. **CTA** contextual: prueba, precios, seguridad o demo; nunca dos CTAs compitiendo.
7. **Enlaces internos**: 2-4 al clúster y 1 a `/#pricing` o `/#security`.
8. **Metadatos**: title ≤ 60 caracteres, description 140-160, canonical, hreflang, OG localizada.
9. **Schema**: `BlogPosting` + `BreadcrumbList`; `FAQPage` solo si las preguntas son visibles.
10. **Autoría y fecha**: autor de organización, `datePublished`, `dateModified`; revisión trimestral.

## 6. Enlazado interno

- Cada post nuevo enlaza a:
  - el post existente más cercano (`choose-software` o `cost` para decisiones;
  - `migration` para cambios de proveedor;
  - `/#pricing` para coste;
  - `/#security` para datos;
  - `/#contact` para demo.
- Cada post existente recibe al menos 2 enlaces nuevos desde el clúster.
- Evitar canibalización: una URL principal por intención. Las comparativas usan “alternativas” y “cómo elegir”; no duplican “cuánto cuesta”.
- Los enlaces entre idiomas se resuelven con `homePath(lang)` y `postPath(lang, post)`, no con anchors desnudos.

## 7. Distribución

- **SEO:** publicación + sitemap + Indexing API cuando esté disponible; no repetir envíos sin cambios.
- **GEO:** respuestas citables, tablas, definiciones y datos propios; `llms.txt` ya generado.
- **Outbound local:** enviar la checklist de migración a clínicas del Garraf/Penedès; usar el artículo como material de conversación, no como spam.
- **Ads:** usar las piezas de coste y alternativas como landing de apoyo cuando existan datos de GSC/Ads.
- **Newsletter:** resumen mensual con una decisión práctica y un enlace al post; sin promesas de ahorro no verificadas.

## 8. Medición

Baseline pendiente de GSC. Cuando esté disponible:

- Impresiones, clics, CTR y posición media por URL y consulta.
- Consultas nuevas por clúster y páginas que entran en top 20.
- CTA clicks a signup, `demo=1`, `plan=base` y `region`.
- Signups iniciados/completados y demos solicitadas.
- Por idioma: ES, EN, CA.
- Revisión mensual: ganar/actualizar/fusionar/retirar. No escalar contenido si no hay señal de utilidad.

## 9. Próximos pasos

1. Validar el estado real de facturación fiscal antes de escribir sobre VeriFactu/TicketBAI/CFDI.
2. Reautorizar GSC con `scripts/seed-oauth.mjs` o configurar `GSC_KEY_FILE`.
3. Producir la semana 1 (checklist de migración) y enlazarla desde `migration`.
4. Medir 28 días antes de decidir la semana 5.
5. Revisar trimestralmente fechas, precios y afirmaciones de competencia.
