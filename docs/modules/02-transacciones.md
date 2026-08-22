# Módulo: Transacciones

`transactions` · Fase 1 (MVP)

## Objetivo

El núcleo de la aplicación: cada movimiento de dinero (ingreso, gasto, transferencia o ajuste) se
registra aquí. Todo lo demás (presupuestos, dashboard, reportes, metas) lee de este módulo.

## Entidad: `Transaction`

```prisma
enum TransactionType {
  INCOME
  EXPENSE
  TRANSFER
  ADJUSTMENT
}

model Transaction {
  id          String          @id @default(uuid())
  user_id     String
  account_id  String
  category_id String?
  type        TransactionType
  amount      Decimal         @db.Decimal(18, 4)   // siempre positivo — ver regla de negocio
  currency_code String        @db.Char(3)
  description String?
  merchant    String?
  date        DateTime
  location    String?
  notes       String?

  // Solo para type = TRANSFER
  transfer_account_id String?   // cuenta destino
  transfer_group_id   String?   // agrupa las dos filas (origen/destino) de una misma transferencia
  exchange_rate       Decimal?  @db.Decimal(18, 8)  // si origen y destino tienen distinta moneda

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?
  status     Status    @default(ACTIVE)

  account  FinancialAccount @relation(fields: [account_id], references: [id])
  category Category?        @relation(fields: [category_id], references: [id])
  tags     TransactionTag[]
  documents Document[]

  @@map("transactions")
}
```

## Reglas de negocio

**`amount` siempre positivo.** La dirección del dinero la define `type`, no el signo del monto. Esto
evita errores de doble negativo al sumar/restar en reportes. Al calcular el efecto sobre el balance
de la cuenta: `INCOME` suma, `EXPENSE` resta, `ADJUSTMENT` puede sumar o restar según se registre
explícitamente (ver más abajo), `TRANSFER` resta de la cuenta origen y suma en la cuenta destino.

**El balance de la cuenta se actualiza en la misma transacción de base de datos** que crea, edita o
elimina el registro (ver [01 — Cuentas](./01-cuentas.md)). Editar un monto o reasignar de cuenta
implica revertir el efecto anterior y aplicar el nuevo, no solo sumar la diferencia a ciegas.

**Transferencias son dos filas ligadas.** `create-transfer` crea dos `Transaction` (una `EXPENSE`
lógica en la cuenta origen, una `INCOME` lógica en la cuenta destino) compartiendo
`transfer_group_id`. Si origen y destino tienen monedas distintas, `exchange_rate` registra el tipo
de cambio usado en ese momento (histórico, no se recalcula después). Eliminar una transferencia
elimina ambas filas juntas — nunca una sola.

**`ADJUSTMENT`** existe para correcciones manuales de saldo (ej. cuadre inicial al dar de alta una
cuenta con historial previo, o corrección tras una reconciliación). No debería usarse para gastos o
ingresos reales — esos siempre son `INCOME`/`EXPENSE`.

**Búsqueda avanzada** (del borrador original) no es un módulo aparte: es el caso de uso
`list-transactions` con filtros combinables — cuenta, categoría, etiqueta, comercio, descripción,
rango de fechas, rango de montos, tipo. Se implementa como un único query con parámetros opcionales,
no como endpoints separados por filtro.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-transaction` | Command |
| `update-transaction` | Command |
| `delete-transaction` | Command |
| `create-transfer` | Command |
| `list-transactions` | Query (filtros combinados = búsqueda avanzada) |
| `get-transaction` | Query |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/transactions` | Lista con filtros por query params |
| POST | `/api/finance/transactions` | Crear ingreso/gasto/ajuste |
| POST | `/api/finance/transactions/transfer` | Crear transferencia (dos filas) |
| GET | `/api/finance/transactions/:id` | Detalle |
| PATCH | `/api/finance/transactions/:id` | Actualizar |
| DELETE | `/api/finance/transactions/:id` | Eliminar (y su par, si es transferencia) |

## Frontend

`TransactionsListView` (tabla con filtros avanzados, paginación), drawer `TransactionForm` (con
selector de cuenta/categoría/etiquetas y adjuntar documento), composables `useTransactions` y
`useTransactionFilters`.

## Relaciones con otros módulos

Escribe en [Cuentas](./01-cuentas.md) (balance). Lee de [Categorías y etiquetas](./03-categorias-y-etiquetas.md).
Es la fuente de datos de [Presupuestos](./04-presupuestos.md), [Dashboard](./14-dashboard.md) y
[Reportes](./11-reportes-y-estadisticas.md). Puede tener [Documentos](./15-notificaciones-recordatorios-documentos.md)
adjuntos. Es el objetivo de las reglas de [Automatizaciones](./13-automatizaciones-e-ia.md).

## Decisiones abiertas

**Ubicación geográfica (`location`)** se deja como texto libre por ahora; no se modela como
lat/lng estructurado hasta que haya una razón concreta (ej. mapa de gastos) para justificar la
complejidad extra.

**Conciliación bancaria** (marcar una transacción como "conciliada" contra un estado de cuenta
importado) no está en el borrador original ni en el MVP — queda anotado aquí porque suele aparecer
naturalmente al construir importación (fase 2) y puede requerir un campo `status` adicional
(`CLEARED`/`PENDING`) en vez del `Status` genérico. Evaluar cuando se construya
[Importación/Exportación](./12-importacion-exportacion-monedas.md).
