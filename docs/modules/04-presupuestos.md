# Módulo: Presupuestos

`budgets` · Fase 2

## Objetivo

Definir límites de gasto por categoría, cuenta o etiqueta, con periodicidad configurable, y mostrar
en todo momento cuánto se ha gastado, cuánto queda disponible y qué porcentaje se ha usado.

## Entidad: `Budget`

```prisma
enum BudgetPeriod {
  WEEKLY
  MONTHLY
  QUARTERLY
  YEARLY
}

model Budget {
  id       String       @id @default(uuid())
  user_id  String
  name     String?

  // Exactamente uno de los tres debe estar presente (validado en el entity factory)
  category_id String?
  account_id  String?
  tag_id      String?

  period        BudgetPeriod
  amount        Decimal      @db.Decimal(18, 4)
  currency_code String       @db.Char(3)
  start_date    DateTime      // ancla para calcular el periodo vigente

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?
  status     Status    @default(ACTIVE)

  category Category?        @relation(fields: [category_id], references: [id])
  account  FinancialAccount? @relation(fields: [account_id], references: [id])
  tag      Tag?              @relation(fields: [tag_id], references: [id])

  @@map("budgets")
}
```

Se usan tres columnas FK nullable (no una clave polimórfica) para mantener integridad referencial
real, siguiendo el estilo del resto del esquema.

## Reglas de negocio

**Un presupuesto es una regla recurrente, no una fila por periodo.** El usuario lo crea una sola
vez (ej. "Alimentación, $300/mes, desde el 1 de enero"); el sistema calcula el rango de fechas del
periodo *vigente* dinámicamente a partir de `start_date` + `period` cada vez que se consulta —
nunca se generan filas nuevas cada mes.

**"Gastado" se calcula on-read, no se cachea.** `spent` = suma de `Transaction.amount` donde
`type = EXPENSE`, la fecha cae dentro del periodo vigente, y la transacción matchea el alcance
(`category_id`/`account_id`/`tag_id`) del presupuesto. Se documenta como optimización futura
cachear este valor si el volumen de transacciones lo justifica — no se implementa así desde el
inicio.

**Valores derivados:** `available = amount - spent`; `percentage_used = spent / amount * 100`
(clamped a 100+ para permitir mostrar sobregiro).

**Rollover de sobrante** (acumular lo no gastado al siguiente periodo) no está en el borrador
original y no se implementa en esta fase — queda anotado como posible extensión futura, no como
decisión pendiente urgente.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-budget` | Command |
| `update-budget` | Command |
| `delete-budget` | Command |
| `list-budgets-with-progress` | Query (agrega `spent`/`available`/`percentage_used` por presupuesto) |
| `get-budget-progress` | Query (detalle de un presupuesto) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/budgets` | Lista con progreso calculado |
| POST | `/api/finance/budgets` | Crear |
| GET | `/api/finance/budgets/:id` | Detalle con progreso |
| PATCH | `/api/finance/budgets/:id` | Actualizar |
| DELETE | `/api/finance/budgets/:id` | Borrar |

## Frontend

`BudgetsListView` (barras de progreso, color según % usado), `BudgetForm`. Composable `useBudgets`.

## Relaciones con otros módulos

Alcance definido por [Categorías/Cuentas/Etiquetas](./03-categorias-y-etiquetas.md). Cálculo basado
en [Transacciones](./02-transacciones.md). Resumen visible en [Dashboard](./14-dashboard.md)
("presupuesto utilizado").

## Decisiones abiertas

Determinar el "periodo vigente" cuando `start_date` es una fecha antigua y `period = MONTHLY`
requiere una función de cálculo de rango de fechas cuidadosa (meses de distinta duración, año
bisiesto si el periodo fuera anual). Se recomienda una única función utilitaria compartida
(`getCurrentPeriodRange(start_date, period, referenceDate)`) reutilizada también por
[Metas de ahorro](./05-metas-de-ahorro.md) y [Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md),
que comparten el mismo problema de periodicidad.
