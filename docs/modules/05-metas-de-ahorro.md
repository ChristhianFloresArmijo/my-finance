# Módulo: Metas de Ahorro

`goals` · Fase 2

## Objetivo

Definir objetivos de ahorro (ej. "Viaje a Japón") con monto objetivo, fecha límite y aportes —
manuales o automáticos — llevando el progreso a lo largo del tiempo.

## Entidades

```prisma
enum GoalStatus {
  IN_PROGRESS
  ACHIEVED
  ABANDONED
}

enum ContributionSource {
  MANUAL
  AUTOMATIC
}

model SavingsGoal {
  id              String       @id @default(uuid())
  user_id         String
  name            String
  target_amount   Decimal      @db.Decimal(18, 4)
  currency_code   String       @db.Char(3)
  target_date     DateTime?
  linked_account_id String?    // cuenta donde físicamente se guarda el ahorro (opcional)

  auto_contribution_amount    Decimal?             @db.Decimal(18, 4)
  auto_contribution_frequency RecurrenceFrequency?

  icon   String?
  color  String?
  status GoalStatus @default(IN_PROGRESS)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?

  linked_account FinancialAccount?   @relation(fields: [linked_account_id], references: [id])
  contributions  GoalContribution[]

  @@map("savings_goals")
}

model GoalContribution {
  id             String              @id @default(uuid())
  goal_id        String
  amount         Decimal             @db.Decimal(18, 4)
  date           DateTime
  source         ContributionSource  @default(MANUAL)
  transaction_id String?             // si el aporte proviene de una Transaction real
  notes          String?

  created_at DateTime @default(now())

  goal        SavingsGoal  @relation(fields: [goal_id], references: [id], onDelete: Cascade)
  transaction Transaction? @relation(fields: [transaction_id], references: [id])

  @@map("goal_contributions")
}
```

`RecurrenceFrequency` se define una sola vez y se comparte con
[Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md).

## Reglas de negocio

**El progreso nunca se edita directamente.** `current_amount` no existe como columna editable —
se calcula siempre como la suma de `GoalContribution.amount` para esa meta. Esto evita que el
número mostrado se desincronice del historial de aportes.

**Evitar doble conteo cuando hay `linked_account_id`.** Si una aportación tiene `transaction_id`
(vino de un movimiento real registrado en `Transacciones`), ese dinero ya está reflejado en el
balance de la cuenta vinculada. El progreso de la meta es una *vista* de ese mismo dinero, no dinero
adicional — al calcular patrimonio neto no se debe sumar el balance de la cuenta Y el progreso de la
meta como si fueran dos activos distintos (ver nota en
[Activos y patrimonio](./08-activos-y-patrimonio.md)).

**Aportación manual sin cuenta vinculada** es puramente informativa: no mueve saldo de ninguna
cuenta, solo registra intención/seguimiento de ahorro.

**Aporte automático** requiere el mismo mecanismo de tareas programadas que
[Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md) — construirlos en el mismo momento
tiene sentido por eso, aunque son módulos separados.

**Cambio de estado.** `ACHIEVED` se marca automáticamente cuando `current_amount >= target_amount`
(chequeo en el handler que agrega una contribución, no un cron separado). `ABANDONED` es una acción
manual del usuario.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-goal` | Command |
| `update-goal` | Command |
| `abandon-goal` | Command |
| `add-contribution` | Command (dispara chequeo de `ACHIEVED`) |
| `remove-contribution` | Command |
| `list-goals-with-progress` | Query |
| `get-goal` | Query (incluye historial de aportes) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/goals` | Lista con progreso |
| POST | `/api/finance/goals` | Crear meta |
| GET | `/api/finance/goals/:id` | Detalle + historial de aportes |
| PATCH | `/api/finance/goals/:id` | Actualizar |
| POST | `/api/finance/goals/:id/contributions` | Registrar aporte |
| DELETE | `/api/finance/goals/:id/contributions/:contributionId` | Eliminar aporte |

## Frontend

`GoalsListView` (tarjetas con barra de progreso), `GoalDetailView` (historial de aportes + gráfica
de evolución). Composable `useGoals`.

## Relaciones con otros módulos

Puede vincularse a una [Cuenta](./01-cuentas.md). Un aporte puede originarse de una
[Transacción](./02-transacciones.md). El aporte automático depende del mismo mecanismo que
[Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md). Visible en
[Dashboard](./14-dashboard.md) ("metas de ahorro") y en
[Reportes/estadísticas](./11-reportes-y-estadisticas.md) ("evolución del ahorro").

## Decisiones abiertas

Ninguna crítica; la principal es la regla de no doble conteo ya documentada arriba, que debe
respetarse al construir el módulo de Patrimonio.
