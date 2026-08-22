# Módulo: Cuentas

`financial_accounts` · Fase 1 (MVP)

## Objetivo

Permitir administrar múltiples cuentas financieras (bancarias, efectivo, tarjetas de crédito,
inversión, ahorro, cripto, préstamos) como el punto de partida de todo lo demás: toda transacción
pertenece a una cuenta.

## Entidad: `FinancialAccount`

```prisma
enum AccountType {
  BANK
  CASH
  CREDIT_CARD
  INVESTMENT
  SAVINGS
  CRYPTO
  LOAN
}

model FinancialAccount {
  id            String      @id @default(uuid())
  user_id       String
  name          String
  type          AccountType
  institution   String?
  currency_code String      @db.Char(3)   // ISO 4217
  balance       Decimal     @db.Decimal(18, 4) @default(0)  // ver "Balance" abajo
  credit_limit  Decimal?    @db.Decimal(18, 4)              // solo CREDIT_CARD
  statement_day Int?                                         // día de corte, solo CREDIT_CARD
  color         String?
  icon          String?
  is_archived   Boolean     @default(false)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?
  status     Status    @default(ACTIVE)

  user         User          @relation(fields: [user_id], references: [id], onDelete: Cascade)
  transactions Transaction[]

  @@map("financial_accounts")
}
```

## Reglas de negocio

**Balance denormalizado, no calculado on-read.** `balance` se actualiza atómicamente (misma
transacción de base de datos) cada vez que se crea, edita o elimina una `Transaction` asociada. Se
mantiene también un caso de uso `recalculate-account-balance` que recorre el historial de
transacciones y recompone el balance desde cero — es la herramienta de reconciliación cuando algo no
cuadra, y sirve como fuente de verdad para verificar que el balance cacheado sea correcto.

**Archivar vs. eliminar.** `is_archived = true` oculta la cuenta de las vistas activas y del
dashboard sin borrar su historial (útil para una tarjeta cancelada o una cuenta que ya no se usa).
El borrado lógico (`deleted_at` + `status = DELETED`) es distinto y más definitivo — solo debería
permitirse si la cuenta no tiene transacciones, o advertir explícitamente que las transacciones
asociadas quedarán huérfanas de vista (pero no se borran).

**Tarjetas de crédito.** `credit_limit` y `statement_day` solo aplican a `type = CREDIT_CARD`; el
"crédito disponible" (`credit_limit - balance`, cuando `balance` representa el saldo usado) es un
valor calculado, no almacenado.

**Multi-moneda.** Cada cuenta tiene su propia `currency_code`. Una transferencia entre cuentas de
distinta moneda requiere un tipo de cambio explícito en el momento — ver
[02 — Transacciones](./02-transacciones.md).

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-account` | Command |
| `update-account` | Command |
| `archive-account` | Command |
| `delete-account` | Command |
| `recalculate-account-balance` | Command |
| `get-account` | Query |
| `list-accounts` | Query (filtro: incluir archivadas o no) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/accounts` | Lista de cuentas del usuario autenticado |
| POST | `/api/finance/accounts` | Crear cuenta |
| GET | `/api/finance/accounts/:id` | Detalle |
| PATCH | `/api/finance/accounts/:id` | Actualizar |
| DELETE | `/api/finance/accounts/:id` | Borrado lógico |
| POST | `/api/finance/accounts/:id/archive` | Archivar/desarchivar |
| POST | `/api/finance/accounts/:id/recalculate-balance` | Reconciliar balance desde el historial |

## Frontend

Vistas: `AccountsListView` (tarjetas por tipo, con color/icono), drawer `AccountFormView` para
crear/editar. Composable `useAccounts` expone `accounts`, `createAccount`, `updateAccount`,
`archiveAccount`.

## Relaciones con otros módulos

Fuente de datos para [Transacciones](./02-transacciones.md), [Patrimonio neto](./08-activos-y-patrimonio.md)
(una cuenta con `balance` positivo suma como activo; una tarjeta de crédito con saldo usado suma
como pasivo), y potencialmente para [Deudas](./06-deudas.md) cuando una cuenta `LOAN`/`CREDIT_CARD`
necesita seguimiento de intereses (ver decisión abierta abajo).

## Decisiones abiertas

**Relación entre `FinancialAccount` (tipo `LOAN`/`CREDIT_CARD`) y el módulo de Deudas.** Una tarjeta
de crédito o un préstamo son a la vez una "cuenta" (tienen balance, reciben transacciones) y una
"deuda" (tienen tasa de interés, fecha de vencimiento, pago mínimo). Recomendación: `Debt` (ver
[06 — Deudas](./06-deudas.md)) tiene un `financial_account_id` **opcional** — se usa cuando la
deuda es del día a día (tarjeta de crédito) y se deja `null` cuando es una deuda que no necesita
ledger transaccional propio (ej. una hipoteca que solo se paga desde otra cuenta). Confirmar esta
decisión al construir el módulo de Deudas, no antes.
