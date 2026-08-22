# Documentación — Dominio Financiero

Esta carpeta es la especificación de referencia del dominio financiero de **my-finance**: refina el
borrador original de requisitos ("Requisitos de Aplicación Web de Finanzas Personales.pdf") a la luz
del código que ya existe en el monorepo, y sirve de guía para construir manualmente lo que falta.

No documenta identidad/autenticación/autorización/administración — eso ya está construido y
documentado en `apps/api/docs/` y `apps/web/docs/`.

## Cómo leer esta documentación

1. Empieza por los documentos núcleo, en orden — dan el contexto necesario para que cada módulo
   tenga sentido.
2. Cuando vayas a construir un módulo financiero, abre su documento en `modules/` — trae entidades,
   reglas de negocio, casos de uso y endpoints sugeridos.
3. Cada módulo enlaza a los módulos con los que se relaciona — sigue los enlaces si algo no queda
   claro por sí solo.
4. Las secciones "Decisiones abiertas" al final de cada documento son señales explícitas de dónde
   todavía hay que decidir algo al momento de implementar — no son huecos por descuido.

## Documentos núcleo

| Doc | Contenido |
|---|---|
| [01 — Visión general](./01-vision-general.md) | Objetivo, alcance por fases, usuarios objetivo, principios de diseño |
| [02 — Stack tecnológico](./02-stack-tecnologico.md) | Stack real vs. borrador original, decisiones que se apartan del borrador |
| [03 — Arquitectura](./03-arquitectura.md) | Organización plana de módulos bajo `modules/`, reglas transversales, checklist para agregar un módulo |
| [04 — Modelo de dominio y convenciones](./04-modelo-de-dominio-y-convenciones.md) | Convenciones de esquema, dinero/moneda, pertenencia por `user_id`, diagrama ER general |
| [05 — Estado actual y roadmap](./05-estado-actual-y-roadmap.md) | Qué ya está construido, qué falta, fases 1-5 |

## Módulos del dominio financiero

| # | Módulo | Fase |
|---|---|---|
| [01](./modules/01-cuentas.md) | Cuentas | 1 (MVP) |
| [02](./modules/02-transacciones.md) | Transacciones | 1 (MVP) |
| [03](./modules/03-categorias-y-etiquetas.md) | Categorías y etiquetas | 1 (MVP) |
| [04](./modules/04-presupuestos.md) | Presupuestos | 2 |
| [05](./modules/05-metas-de-ahorro.md) | Metas de ahorro | 2 |
| [06](./modules/06-deudas.md) | Deudas | 3 |
| [07](./modules/07-inversiones.md) | Inversiones | 3 |
| [08](./modules/08-activos-y-patrimonio.md) | Activos y patrimonio neto | 3 |
| [09](./modules/09-pagos-recurrentes-y-calendario.md) | Pagos recurrentes y calendario financiero | 2 |
| [10](./modules/10-impuestos.md) | Impuestos | 4 |
| [11](./modules/11-reportes-y-estadisticas.md) | Reportes y estadísticas | 1 (básico) → 4 (avanzado) |
| [12](./modules/12-importacion-exportacion-monedas.md) | Importación, exportación y monedas | 2 |
| [13](./modules/13-automatizaciones-e-ia.md) | Automatizaciones e IA | 4 (automatizaciones) → 5 (IA) |
| [14](./modules/14-dashboard.md) | Dashboard | 1 (básico) → crece hasta fase 4 |
| [15](./modules/15-notificaciones-recordatorios-documentos.md) | Notificaciones, recordatorios y documentos | 2 → 3 |
| [16](./modules/16-suscripciones-y-facturacion.md) | Suscripciones y facturación (`billing`, módulo de plataforma — no es dominio financiero) | Pista de monetización, en paralelo — [ver roadmap](./05-estado-actual-y-roadmap.md#pista-paralela-monetización-suscripciones-y-facturación) |

## Qué cambió respecto al borrador original

El contenido funcional del borrador (objetivos, campos por módulo, roadmap MVP→v4) se conserva casi
íntegro. Lo que se corrigió o se hizo explícito:

- Stack tecnológico actualizado a lo que realmente existe (Vue/NestJS/Prisma, no React/Django) —
  ver [02 — Stack tecnológico](./02-stack-tecnologico.md).
- Nomenclatura de módulos definida para no chocar con el módulo `account` (usuario) ya existente —
  ver [03 — Arquitectura](./03-arquitectura.md).
- Convenciones de dinero, moneda y pertenencia de datos, ausentes en el borrador — ver
  [04 — Modelo de dominio y convenciones](./04-modelo-de-dominio-y-convenciones.md).
- Orden de construcción ajustado (impuestos y calendario financiero se movieron a después de sus
  fuentes de datos) — ver [05 — Estado actual y roadmap](./05-estado-actual-y-roadmap.md).
- Cada módulo ahora especifica entidades concretas, reglas de cálculo, casos de uso nombrados
  siguiendo la convención `capabilities/` ya usada en el proyecto, y endpoints sugeridos — el
  borrador original solo listaba campos e ideas generales.
- Se documentan explícitamente los puntos donde el borrador era ambiguo o dejaba una decisión sin
  resolver (ej. relación cuenta↔deuda, bienes raíces como inversión vs. activo, cálculo de
  impuestos fuera de alcance legal, documentos como única excepción a FKs explícitas).
- El borrador original no contemplaba cobrar por el servicio. Se confirmó que habrá suscripción
  por usuario desde que se abra a terceros — se agregó el módulo de plataforma
  [16 — Suscripciones y facturación](./modules/16-suscripciones-y-facturacion.md), separado del
  dominio financiero y del RBAC existente, con su propia pista en el roadmap.
