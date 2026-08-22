# Visión General

## Objetivo

Construir una aplicación web de finanzas personales que centralice patrimonio, ingresos, gastos,
presupuestos, deudas, inversiones, impuestos y metas financieras en un solo lugar, con herramientas
de análisis y planificación que ayuden a tomar mejores decisiones económicas.

El proyecto nace como una herramienta de uso personal, pero se diseña desde el inicio para poder
evolucionar hacia un servicio multi-usuario en la nube (SaaS) sin tener que rehacer la base de datos
o la arquitectura.

## Objetivos principales

Centralizar todas las finanzas personales en un único sistema. Facilitar el seguimiento de ingresos
y gastos con el mínimo esfuerzo de captura. Administrar presupuestos por categoría, cuenta o
etiqueta. Administrar deudas, calculando intereses y proyecciones automáticamente. Llevar control
del patrimonio neto (activos − pasivos) a lo largo del tiempo. Controlar inversiones y su
rentabilidad. Gestionar obligaciones fiscales y su planeación. Ayudar a planificar y alcanzar metas
de ahorro. Proporcionar estadísticas y reportes que soporten la toma de decisiones.

## Alcance por fases

El detalle fase por fase vive en [05 — Estado actual y roadmap](./05-estado-actual-y-roadmap.md).
En resumen:

- **Fase 0 (completada):** identidad — usuarios, autenticación (JWT + 2FA + passkeys a futuro), RBAC,
  panel de administración.
- **Fase 1 (MVP financiero):** cuentas, transacciones, categorías/etiquetas, dashboard básico,
  reportes básicos, búsqueda.
- **Fase 2:** presupuestos, metas de ahorro, pagos recurrentes, calendario financiero, recordatorios,
  notificaciones, importación/exportación, monedas.
- **Fase 3:** inversiones, activos, patrimonio neto, deudas (incluye simulador de intereses),
  documentos adjuntos.
- **Fase 4:** impuestos, automatizaciones, reportes avanzados y estadísticas.
- **Fase 5 (futuro, exploratorio):** inteligencia artificial (OCR, clasificación automática,
  predicciones), integración bancaria directa, uso compartido en familia, y — si se decide dar el
  salto — despliegue como servicio multi-tenant en la nube.

## Usuarios objetivo

**Hoy:** una sola persona (uso personal), administrando sus propias cuentas y finanzas.

**Modelo de negocio confirmado (no exploratorio): suscripción por usuario.** Cuando la aplicación se
abra a alguien más que no sea Kishan, cobrará una suscripción — cada usuario paga individualmente
por su propio acceso, igual que cada usuario ya es dueño exclusivo y aislado de sus propios datos
financieros. Esto **no** requiere un modelo de "hogar" compartido ni multi-tenant en el sentido de
compartir datos entre personas — es, en esencia, "cobrar por usar el producto" superpuesto al
modelo multi-usuario que ya existe. El detalle técnico vive en
[16 — Suscripciones y facturación](./modules/16-suscripciones-y-facturacion.md) y su lugar en el
roadmap en [05 — Estado actual y roadmap](./05-estado-actual-y-roadmap.md#pista-paralela-monetización-suscripciones-y-facturación).

**Fase futura (no MVP, sí exploratoria):** grupo familiar con acceso *compartido* a ciertas
cuentas/presupuestos — dos o más personas viendo los mismos datos (rol "Familia" ya contemplado en
el documento de requisitos original, pero **no** implementado todavía — el sistema de roles actual
es RBAC global de aplicación, no un modelo de "hogar" o "espacio compartido". Ver la sección de
decisiones abiertas en [04 — Modelo de dominio y convenciones](./04-modelo-de-dominio-y-convenciones.md)).
Esto es un problema distinto y más complejo que cobrar suscripción — es multi-tenant en el sentido
de *compartir datos*, no solo de cobrar por accesos individuales aislados.

**Fase futura (exploratoria):** si además de cobrar suscripción individual se quisiera vender el
servicio a organizaciones/equipos con múltiples miembros y su propia administración, se necesitaría
un concepto de tenant/organización que hoy no existe — se documenta como extensión, no se construye
ahora.

## Fuera de alcance por ahora

Integración bancaria directa (open banking / agregadores tipo Plaid), inteligencia artificial,
OCR de recibos y facturación electrónica quedan explícitamente fuera del MVP y de las fases 2-4.
Se documentan en [13 — Automatizaciones e IA](./modules/13-automatizaciones-e-ia.md) como visión a
futuro, para que las decisiones de modelado actuales no las bloqueen.

## Principios de diseño

**Precisión numérica ante todo.** El dinero nunca se representa con `float`/`number` de punto
flotante ni en el backend ni en el frontend. Ver convención de tipos de dato en
[04 — Modelo de dominio y convenciones](./04-modelo-de-dominio-y-convenciones.md).

**Multi-moneda desde el día uno del dominio financiero.** Aunque el usuario inicial solo use una
moneda, cada cuenta y transacción registra su moneda explícitamente para no tener que migrar datos
después.

**Todo pertenece a un usuario.** Cada entidad financiera se filtra siempre por `user_id` a nivel de
repositorio — nunca a nivel de controlador — para que el día que exista un modelo de "hogar" u
"organización" el cambio sea aditivo, no una reescritura.

**Arquitectura modular pensada para crecer.** Se mantiene la separación DDD por capas ya establecida
en el proyecto (`business` → `capabilities` → `integration`/`presentation`) tanto en el backend como
en el frontend, de modo que cada módulo financiero nuevo pueda extraerse a un servicio independiente
más adelante si el proyecto pasa a la nube.

**Documentación como contrato de trabajo.** Como el código se escribirá manualmente, cada módulo de
`docs/modules/` funciona como especificación de referencia: entidades, reglas de negocio, casos de
uso y endpoints sugeridos, para que la implementación no dependa de recordar decisiones tomadas en
el chat.
