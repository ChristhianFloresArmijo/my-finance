# Estado Actual y Roadmap

## Qué ya está construido (Fase 0 — identidad y acceso)

No forma parte del dominio financiero, pero es la base sobre la que se construye todo lo demás.

- [x] Usuarios: CRUD, perfil (`UserProfile`), preferencias (`UserPreferences`: tema, idioma, zona
      horaria, notificaciones).
- [x] Autenticación: JWT vía cookies, sign-in/up/out, refresh tokens, 2FA/TOTP (implementación propia
      con `crypto` de Node, sin librerías externas), códigos de recuperación.
- [x] Autorización: RBAC completo — roles, permisos `(resource, action, scope)`, asignación directa
      de permisos a usuario, guards (`JwtAuthGuard`, `RolesGuard`, `PermissionsGuard`, `IsOwnerGuard`).
- [x] Panel de administración (frontend): usuarios, roles, permisos, auditoría, dashboard de stats.
- [x] Infraestructura: Docker Compose por app, Prisma + PostgreSQL, envío de correo (Mailhog en
      local), almacenamiento de archivos abstraído (`IStorageProvider` con implementación local y S3).
- [ ] Passkeys y OAuth (pendiente, no bloquea nada del dominio financiero).
- [ ] `ChangeLog` (tabla de auditoría) existe en el esquema pero ningún handler escribe en ella
      todavía — pendiente de conectar.

## Lo que falta: dominio financiero

Nada de lo siguiente existe aún en el código — es el trabajo por delante. El orden propuesto prioriza
tener un ciclo completo "registrar dinero → verlo reflejado" lo antes posible, y deja para el final lo
que depende de otros módulos o es más especulativo (impuestos, automatizaciones, IA).

### Fase 1 — MVP financiero

El núcleo sin el cual nada más tiene sentido.

- [ ] [Cuentas](./modules/01-cuentas.md) — `financial_accounts`
- [ ] [Transacciones](./modules/02-transacciones.md) — `transactions`
- [ ] [Categorías y etiquetas](./modules/03-categorias-y-etiquetas.md) — `categorization`
- [ ] [Dashboard](./modules/14-dashboard.md) (versión básica: balance, ingresos/gastos del mes,
      flujo de caja)
- [ ] [Reportes y estadísticas](./modules/11-reportes-y-estadisticas.md) (versión básica: por
      categoría/cuenta/mes, exportables en CSV)
- [ ] Búsqueda avanzada (parte de `transactions` — filtros combinados, no es módulo aparte)

### Fase 2 — Hábito y planificación

- [ ] [Presupuestos](./modules/04-presupuestos.md) — `budgets`
- [ ] [Metas de ahorro](./modules/05-metas-de-ahorro.md) — `goals`
- [ ] [Pagos recurrentes y calendario financiero](./modules/09-pagos-recurrentes-y-calendario.md) —
      `recurring_payments`
- [ ] [Notificaciones, recordatorios y documentos](./modules/15-notificaciones-recordatorios-documentos.md)
      — `reminders`, `documents`
- [ ] [Importación, exportación y monedas](./modules/12-importacion-exportacion-monedas.md) —
      `import_export`, `currencies`

### Fase 3 — Patrimonio

Depende de que cuentas/transacciones ya estén sólidas.

- [ ] [Deudas](./modules/06-deudas.md) (incluye seguimiento de intereses y simulador de pagos) —
      `debts`
- [ ] [Inversiones](./modules/07-inversiones.md) — `investments`
- [ ] [Activos y patrimonio neto](./modules/08-activos-y-patrimonio.md) — `net_worth`

### Fase 4 — Cumplimiento y optimización

- [ ] [Impuestos](./modules/10-impuestos.md) — `taxes`
- [ ] [Automatizaciones](./modules/13-automatizaciones-e-ia.md#automatizaciones) — `automations`
- [ ] Reportes/estadísticas avanzados (ampliar el módulo básico de fase 1 con indicadores: gasto
      promedio diario, comercio con mayor gasto, evolución de ahorro, etc.)

### Fase 5 — Exploratoria (no comprometida)

- [ ] [Inteligencia artificial](./modules/13-automatizaciones-e-ia.md#inteligencia-artificial):
      clasificación automática de transacciones, OCR de recibos, detección de gastos inusuales,
      predicción de flujo de caja/saldo, recomendaciones de ahorro, detección de suscripciones
      olvidadas.
- [ ] Integración bancaria directa.
- [ ] Modelo de "hogar"/familia compartido (ver nota en
      [04 — Modelo de dominio y convenciones](./04-modelo-de-dominio-y-convenciones.md)).
- [ ] Evaluación de multi-tenant *compartido* (varias personas viendo los mismos datos) si el
      proyecto llega a necesitarlo — distinto de la monetización por suscripción, que ya es un
      requisito confirmado y no exploratorio (ver siguiente sección).

## Pista paralela: Monetización (Suscripciones y Facturación)

A diferencia de todo lo anterior, esto **no es exploratorio** — está confirmado que la aplicación
cobrará suscripción a los usuarios desde que se abra a alguien más que no sea Kishan, aunque cada
usuario siga siendo dueño exclusivo y aislado de sus propios datos (sin "hogar" compartido). Por
eso no encaja en la numeración de fases 1-5 del dominio financiero — esas fases están ordenadas por
dependencias de datos financieros entre sí, mientras que facturación es un requisito del negocio
que se puede construir en paralelo, en cualquier momento, y que **debe** estar listo antes de abrir
el registro a usuarios que no sean el propio Kishan.

- [ ] [Suscripciones y facturación](./modules/16-suscripciones-y-facturacion.md) — módulo de
      plataforma `billing` (no es parte del dominio financiero): planes, integración con proveedor
      de pago (Stripe recomendado), webhooks con idempotencia, feature-gating por plan.
- [ ] Términos de Servicio y Política de Privacidad (documento legal, no código — necesario antes
      de cobrar a cualquier persona que no sea el propio desarrollador).
- [ ] Despliegue en la nube con expectativas de producción (más allá del `docker-compose.yml` de
      desarrollo local): monitoreo, backups verificados, plan ante incidentes de seguridad.

Ninguno de estos tres puntos bloquea seguir construyendo las fases 1-4 del dominio financiero para
uso personal — solo son requisito para el día que se decida cobrar a un tercero.

## Diferencias con el roadmap del borrador original

El borrador agrupaba "Inversiones, Activos, Patrimonio, Deudas, Intereses, Calendario financiero,
Impuestos" en un único "Versión 3". Aquí se separan en fases 3 y 4 porque impuestos y calendario
financiero dependen de que existan pagos recurrentes y deudas ya modelados (el calendario agrega
eventos de varios módulos; no tiene sentido construirlo antes que sus fuentes de datos). El resto del
contenido del borrador (objetivos, módulos, campos) se mantiene — lo que cambia es el orden de
construcción, no el alcance.
