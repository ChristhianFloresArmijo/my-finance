# Módulo: Pagos Recurrentes y Calendario Financiero

`recurring_payments` · Fase 2

## Objetivo

Registrar suscripciones y pagos periódicos (Netflix, Spotify, seguros, internet, electricidad,
agua, colegiaturas, renta) con recordatorios automáticos, y ofrecer un calendario financiero que
agregue todos los eventos de dinero futuros del sistema en un solo lugar.

## Entidad: `RecurringPayment`

```prisma
model RecurringPayment {
  id            String              @id @default(uuid())
  user_id       String
  name          String
  category_id   String?
  account_id    String?             // cuenta desde la que se paga
  amount        Decimal             @db.Decimal(18, 4)
  currency_code String              @db.Char(3)
  frequency     RecurrenceFrequency
  day_of_month  Int?                // para calcular next_due_date
  next_due_date DateTime

  auto_generate_transaction Boolean @default(false)
  reminder_days_before      Int?    @default(3)
  is_active                 Boolean @default(true)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?

  category Category?        @relation(fields: [category_id], references: [id])
  account  FinancialAccount? @relation(fields: [account_id], references: [id])

  @@map("recurring_payments")
}
```

## El calendario financiero **no es una tabla propia**

Es una vista de solo lectura que agrega eventos de varias fuentes en un rango de fechas:

- `RecurringPayment.next_due_date` (pagos, suscripciones)
- Vencimientos de [Deudas](./06-deudas.md) (próxima cuota)
- Vencimientos de [Impuestos](./10-impuestos.md) (`TaxObligation.due_date`)
- `SavingsGoal.target_date` ([Metas de ahorro](./05-metas-de-ahorro.md))
- Recordatorios personalizados del usuario ([Recordatorios](./15-notificaciones-recordatorios-documentos.md))

`get-financial-calendar` es una Query que consulta cada módulo fuente y devuelve una lista unificada
de `FinancialEvent` (DTO, no modelo de base de datos) con `date`, `type`, `title`, `amount?`,
`source_module`, `source_id`. Esto evita duplicar información que ya vive en su módulo dueño.

## Reglas de negocio

**`next_due_date` avanza automáticamente.** Un job programado (`@nestjs/schedule`, diario) revisa
los pagos recurrentes activos: si `next_due_date` ya pasó, la recalcula según `frequency` y
`day_of_month`, y dispara el efecto correspondiente.

**Dos modos de pago, configurables por regla individual (no una decisión global de la app):**

- `auto_generate_transaction = true`: el job crea automáticamente una `Transaction` tipo `EXPENSE`
  en la fecha de vencimiento, afectando el balance de la cuenta asociada.
- `auto_generate_transaction = false`: el job solo dispara un recordatorio/notificación
  (`reminder_days_before` antes de la fecha) para que el usuario confirme manualmente.

**Pagos vencidos sin acción no se descartan silenciosamente.** Si pasó la fecha y no se generó ni
confirmó la transacción, el evento debe seguir apareciendo como "vencido" en el calendario/dashboard
hasta que el usuario lo resuelva.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-recurring-payment` | Command |
| `update-recurring-payment` | Command |
| `pause-recurring-payment` | Command (`is_active = false`) |
| `delete-recurring-payment` | Command |
| `list-recurring-payments` | Query |
| `process-due-recurring-payments` | Scheduler (`@Cron`, diario) |
| `get-financial-calendar` | Query (agrega eventos de varios módulos por rango de fechas) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/recurring-payments` | Lista |
| POST | `/api/finance/recurring-payments` | Crear |
| PATCH | `/api/finance/recurring-payments/:id` | Actualizar / pausar |
| DELETE | `/api/finance/recurring-payments/:id` | Borrar |
| GET | `/api/finance/calendar?from=&to=` | Eventos agregados del rango |

## Frontend

`RecurringPaymentsListView`, `CalendarView` (vista mensual, eventos coloreados por tipo/módulo de
origen). Composables `useRecurringPayments`, `useFinancialCalendar`.

## Relaciones con otros módulos

Puede generar [Transacciones](./02-transacciones.md). Usa [Categorías/Cuentas](./03-categorias-y-etiquetas.md).
Agrega eventos de [Deudas](./06-deudas.md), [Impuestos](./10-impuestos.md) y
[Metas de ahorro](./05-metas-de-ahorro.md). Dispara
[Recordatorios/Notificaciones](./15-notificaciones-recordatorios-documentos.md). Visible en
[Dashboard](./14-dashboard.md) ("próximos pagos", "próximos vencimientos").

## Decisiones abiertas

**Motor de tareas programadas.** `@nestjs/schedule` (cron in-process) es suficiente para el MVP y
fase 2 (ver [02 — Stack tecnológico](../02-stack-tecnologico.md)). Migrar a BullMQ + Redis solo si el
volumen de usuarios/reglas lo justifica — no antes.
