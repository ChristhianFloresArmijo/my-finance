# Arquitectura

Este documento describe cómo encaja el dominio financiero (por construir) en la arquitectura que ya
existe para identidad y acceso (ya construida). No repite el detalle interno de cada app — para eso
están `apps/api/docs/02-architecture.md` y `apps/web/docs/02-architecture.md` — sino que fija cómo se
nombran y organizan los módulos nuevos y qué reglas cruzan todo el dominio financiero.

## El patrón ya establecido (no cambia)

Backend (NestJS) y frontend (Vue) siguen la misma idea de capas DDD:

```
business/       → entidades de dominio + interfaces de repositorio (+ servicios de dominio)
capabilities/    → casos de uso (Command/Query + Handler en backend; UseCase en frontend)
integration/     → implementaciones concretas (Prisma en backend, Axios en frontend) + adaptadores
presentation/    → controllers/DTOs (backend) o views/composables (frontend)
```

Backend usa CQRS real (`@nestjs/cqrs`, bus de comandos/queries compartido entre módulos). Frontend
usa el mismo vocabulario de capas pero sin bus — los composables llaman directamente a las clases de
`capabilities/`.

Todo módulo nuevo del dominio financiero **reutiliza este patrón sin excepción**. No se introduce
una segunda convención de carpetas para "lo financiero".

## Organización de módulos: todo plano bajo `modules/`, sin prefijo salvo colisión real

**No se crea una carpeta contenedora `finance/` con submódulos anidados dentro.** Eso rompería el
patrón ya establecido, donde `modules/` es siempre una lista plana de módulos independientes
(`account/`, `authentication/`, `authorization/`, `meta/`, `shared/`) — cada uno un módulo NestJS o
un módulo frontend por derecho propio, no un módulo compuesto por sub-módulos. El dominio financiero
sigue exactamente esa misma regla: cada pieza vive directamente bajo `modules/`, con su propio
nombre descriptivo — sin ningún prefijo compartido tipo `finance_*`.

**El prefijo solo se aplica donde hay una colisión real, no como convención general.** La única
pieza del dominio financiero que necesita un nombre distinto es la de cuentas: el módulo `account`
(perfil de usuario) ya existe, y una "cuenta bancaria" es un concepto distinto que no puede llamarse
`accounts` a secas sin generar confusión con `account`. Por eso, y solo por eso, ese módulo se llama
`financial_accounts` (entidad `FinancialAccount`). El resto — `transactions`, `categorization`,
`budgets`, `goals`, `debts`, `investments`, `net_worth`, `recurring_payments`, `taxes`, `reports`,
`import_export`, `currencies`, `automations`, `reminders`, `documents` — no choca con ningún módulo
existente, así que se queda con su nombre simple, sin prefijo ni sufijo. Si en el futuro un nombre
nuevo llegara a chocar con algo que ya existe, se resuelve ese caso puntual de la misma forma —
dándole un nombre más específico solo a ese módulo — en vez de prefijar todo el dominio "por si
acaso".

Se suma también un nuevo módulo de plataforma, `billing` (suscripciones y facturación — ver
[16 — Suscripciones y facturación](./modules/16-suscripciones-y-facturacion.md)), que no es parte
del dominio financiero: responde "¿por cuál plan paga el usuario?", no "¿qué puede hacer?" (eso
sigue siendo RBAC) ni "cuánto dinero tiene" (eso es el dominio financiero). Vive al mismo nivel
plano que `account`, `authentication` y `authorization`.

```
apps/api/src/modules/
  account/              # ya existe — identidad de usuario
  authentication/       # ya existe
  authorization/        # ya existe
  meta/                 # ya existe
  shared/               # ya existe
  billing/              # nuevo — suscripciones y facturación (plataforma, no financiero)

  financial_accounts/   # Cuentas financieras (FinancialAccount) — único nombre distinto por colisión con `account`
  transactions/         # Transacciones
  categorization/       # Categorías + Etiquetas
  budgets/              # Presupuestos
  goals/                # Metas de ahorro
  debts/                # Deudas, intereses, simulador de pagos
  investments/          # Inversiones
  net_worth/            # Activos + Patrimonio neto
  recurring_payments/   # Pagos recurrentes + Calendario financiero
  taxes/                # Impuestos
  reports/              # Reportes + Estadísticas (solo lectura/agregación)
  import_export/        # Importación / Exportación
  currencies/           # Monedas + tipos de cambio
  automations/          # Reglas de automatización
  reminders/            # Recordatorios + Notificaciones
  documents/            # Documentos adjuntos
```

`apps/web/src/modules/` refleja exactamente la misma lista plana (mismos nombres de carpeta,
`account`/`authentication`/`authorization`/`admin`/`home` ya existentes + `billing` + los módulos
financieros nuevos) — no hay una jerarquía distinta entre backend y frontend.

Cada carpeta es un módulo NestJS/frontend independiente con sus cuatro capas. No hace falta
construirlos todos a la vez — el orden sugerido está en
[05 — Estado actual y roadmap](./05-estado-actual-y-roadmap.md). Un módulo puede empezar como un
`.module.ts` mínimo (solo lectura) e ir creciendo.

### Alias de rutas sugeridos

Backend (`tsconfig.json`, junto a los ya existentes `@account/*`, `@auth/*`, `@authorization/*`,
`@shared/*`): un alias por módulo, con el mismo nombre que la carpeta:

```
@billing/*              → src/modules/billing/*
@financial_accounts/*    → src/modules/financial_accounts/*
@transactions/*          → src/modules/transactions/*
@net_worth/*             → src/modules/net_worth/*
...                        (mismo patrón: @<nombre_de_carpeta>/* → src/modules/<nombre_de_carpeta>/*)
```

Frontend: `@/*` ya apunta a `src/*`, así que basta importar como
`@/modules/financial_accounts/...` sin alias nuevos.

## Reglas que cruzan todo el dominio financiero

**Todo repositorio de finanzas recibe `user_id` como parte de la consulta, nunca como filtro
opcional.** No existe un "listar todas las transacciones" sin usuario — ni siquiera para el rol
`admin`. Esto es lo que permite que, si en el futuro aparece un modelo de "hogar" compartido o de
organización (multi-tenant), el cambio sea agregar una columna/alcance más, no reescribir consultas.

**El dinero nunca es `number`/`float`.** Ver el tipo de dato exacto en
[04 — Modelo de dominio y convenciones](./04-modelo-de-dominio-y-convenciones.md).

**Los cálculos automáticos (intereses, patrimonio neto, progreso de metas, presupuesto usado) se
recalculan en el backend, nunca se confía en un valor que mande el frontend.** El frontend puede
*simular* (ej. simulador de pagos de deudas) sin persistir nada; solo el backend escribe saldos.

**Guards.** Los endpoints de escritura de cualquier módulo financiero requieren
`@UseGuards(JwtAuthGuard)` como mínimo (no hace falta `RolesGuard` salvo endpoints de reportes
agregados a nivel admin). No se reutiliza `RequireRole('superadmin')` para nada del dominio
financiero normal — eso es exclusivo de administración de la plataforma.

## Cómo agregar un módulo financiero nuevo (checklist)

Backend:

1. Definir el modelo Prisma en `schema.prisma` siguiendo las convenciones de
   [04 — Modelo de dominio y convenciones](./04-modelo-de-dominio-y-convenciones.md); correr
   `pnpm prisma:migrate` y `pnpm prisma:generate`.
2. Crear `<módulo>/business/entities/` con el factory `Entity.instance(data)` (Valibot).
3. Crear la interfaz de repositorio en `business/repositories/`.
4. Implementarla en `integration/repositories/` usando `PrismaService` (inyectado, es `@Global()`).
5. Un `capabilities/<acción>/` por caso de uso (`command.ts`/`query.ts` + `handler.ts` + `index.ts`),
   registrado en `capabilities/handlers.ts`.
6. Controller en `presentation/restful/` que solo despacha comandos/queries — la lógica vive en el
   handler, nunca en el controller.
7. DTOs con `class-validator` en `presentation/dtos/`, recordando `@IsOptional()` en todo campo
   opcional (`forbidNonWhitelisted` es global).
8. Registrar el módulo en `app.module.ts`.

Frontend:

1. Entidad + `schemas/` (Zod) en `business/`.
2. Interfaz de repositorio en `business/repositories/`; implementación Axios en
   `integration/repositories/` usando `AdaptedHttpClient`.
3. `UseCase` por caso de uso en `capabilities/`.
4. Composable en `presentation/composables/` (ej. `useAccounts`, `useTransactions`) que expone
   estado reactivo y llama a los casos de uso — las vistas nunca llaman al repositorio directo.
5. Vistas en `presentation/views/`; registrar rutas en `src/router/index.ts`.

## Relación con `apps/api/docs/` y `apps/web/docs/`

Estos documentos de `docs/` (raíz) son específicos del dominio financiero. Los `docs/` dentro de
cada app documentan lo ya construido (autenticación, autorización, testing, setup) y no se
duplican aquí — se referencian por enlace cuando aplica.
