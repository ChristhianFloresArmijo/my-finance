# Módulo: Deudas

`debts` · Fase 3

## Objetivo

Uno de los módulos principales del proyecto (así lo marca el borrador original). Registrar
hipotecas, préstamos, tarjetas de crédito, financiamientos y préstamos personales; calcular
automáticamente intereses, capital pagado y proyecciones; y simular escenarios de pago sin
comprometer nada hasta que el usuario confirme.

## Entidades

```prisma
enum DebtType {
  MORTGAGE
  LOAN
  CREDIT_CARD
  FINANCING
  PERSONAL_LOAN
}

enum InterestType {
  FIXED
  VARIABLE
}

enum DebtStatus {
  ACTIVE
  PAID_OFF
  DEFAULTED
}

enum DebtPaymentType {
  SCHEDULED
  MINIMUM
  EXTRA_PRINCIPAL
}

model Debt {
  id                  String       @id @default(uuid())
  user_id             String
  financial_account_id String?    // opcional — ver 01-cuentas.md, decisión abierta
  name                String
  creditor            String
  type                DebtType
  interest_type       InterestType
  interest_rate       Decimal      @db.Decimal(9, 6)  // tasa anual, %
  initial_balance     Decimal      @db.Decimal(18, 4)
  current_balance     Decimal      @db.Decimal(18, 4)
  currency_code       String       @db.Char(3)
  start_date          DateTime
  due_date            DateTime?    // fecha de vencimiento / fin de plazo, si aplica
  minimum_payment     Decimal      @db.Decimal(18, 4)
  debt_status         DebtStatus   @default(ACTIVE)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?

  financial_account FinancialAccount? @relation(fields: [financial_account_id], references: [id])
  payments          DebtPayment[]

  @@map("debts")
}

model DebtPayment {
  id               String          @id @default(uuid())
  debt_id          String
  date             DateTime
  amount           Decimal         @db.Decimal(18, 4)
  principal_amount Decimal         @db.Decimal(18, 4)
  interest_amount  Decimal         @db.Decimal(18, 4)
  payment_type     DebtPaymentType
  transaction_id   String?         // si se pagó desde una cuenta rastreada
  notes            String?

  created_at DateTime @default(now())

  debt        Debt         @relation(fields: [debt_id], references: [id], onDelete: Cascade)
  transaction Transaction? @relation(fields: [transaction_id], references: [id])

  @@map("debt_payments")
}
```

## Reglas de negocio — seguimiento de intereses

El sistema calcula automáticamente, a partir de `current_balance`, `interest_rate` e historial de
`DebtPayment`: intereses acumulados desde el último pago, capital pagado a la fecha, intereses
pagados a la fecha, saldo restante, costo total proyectado del préstamo, intereses proyectados a
futuro, y tiempo restante estimado para saldar la deuda.

**Dos estrategias de cálculo, según el tipo de deuda** (documentado como servicio de dominio
compartido, ej. `business/services/AmortizationCalculator`):

- **Deuda a plazo fijo** (`MORTGAGE`, `LOAN`, `FINANCING`, `PERSONAL_LOAN` con `due_date` conocido):
  amortización francesa estándar — cuota fija mensual `M = P·r·(1+r)^n / ((1+r)^n − 1)`, con `P`
  = saldo, `r` = tasa mensual, `n` = cuotas restantes. Cada pago se descompone en interés
  (`saldo × r`) y capital (`cuota − interés`).
- **Deuda revolvente** (`CREDIT_CARD`): no tiene un número de cuotas fijo — se simula mes a mes
  (interés del periodo = `saldo × tasa_mensual`; si solo se paga el mínimo, se recalcula el nuevo
  saldo y se repite hasta llegar a cero) en vez de una fórmula cerrada.

Registrar un pago actualiza `current_balance` restando `principal_amount` — nunca se edita
`current_balance` directamente desde la UI.

## Reglas de negocio — simulador de pagos

`simulate-payment-scenario` es una **Query pura, no persiste nada**. Recibe el escenario (pago
mínimo, pago personalizado, pago anticipado, pagos extraordinarios puntuales) y devuelve, sin tocar
la base de datos: tiempo que se reduce la deuda, dinero ahorrado en intereses, nueva fecha de
finalización, nuevo costo total. Usa el mismo `AmortizationCalculator` que el cálculo real, así que
la proyección "de verdad" y la simulación nunca pueden desincronizarse en su matemática.

## Reglas de negocio — pagos a capital (abonos extraordinarios)

`register-extra-principal-payment` crea un `DebtPayment` con `payment_type = EXTRA_PRINCIPAL` donde
todo el monto va a `principal_amount` (`interest_amount = 0`). Tras registrarlo, el sistema
recalcula automáticamente: intereses futuros, cuotas restantes, tiempo restante, y el ahorro total
generado (comparando el plan de amortización antes/después del abono) — este último valor se
muestra al usuario como confirmación de que el abono valió la pena.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-debt` | Command |
| `update-debt` | Command |
| `close-debt` | Command (marca `PAID_OFF` cuando `current_balance = 0`) |
| `delete-debt` | Command |
| `register-payment` | Command (desglose principal/interés automático si no se provee) |
| `register-extra-principal-payment` | Command |
| `list-debts` | Query (con saldo y tiempo restante calculado) |
| `get-debt-detail` | Query (incluye historial + proyección/tabla de amortización) |
| `simulate-payment-scenario` | Query (no persiste) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/debts` | Lista con saldo/tiempo restante |
| POST | `/api/finance/debts` | Crear deuda |
| GET | `/api/finance/debts/:id` | Detalle + tabla de amortización |
| PATCH | `/api/finance/debts/:id` | Actualizar |
| POST | `/api/finance/debts/:id/payments` | Registrar pago (normal o extraordinario) |
| POST | `/api/finance/debts/:id/simulate` | Simular escenario (no persiste) |

## Frontend

`DebtsListView` (tarjetas con saldo y % pagado), `DebtDetailView` (gráfica de evolución de saldo +
tabla de amortización), modal/vista `PaymentSimulatorView` (sliders para pago personalizado /
anticipado / extraordinario, resultados en vivo). Composables `useDebts`, `useDebtSimulator`.

## Relaciones con otros módulos

Puede vincularse a una [Cuenta](./01-cuentas.md). Un pago puede originarse de una
[Transacción](./02-transacciones.md). Es pasivo en [Patrimonio neto](./08-activos-y-patrimonio.md).
Sus vencimientos alimentan el [Calendario financiero](./09-pagos-recurrentes-y-calendario.md) y el
[Dashboard](./14-dashboard.md) ("deudas pendientes", "próximos vencimientos").

## Decisiones abiertas

**Fórmula exacta de interés por tipo de producto real.** Distintos acreedores calculan interés
diario compuesto, mensual compuesto, o simple, de formas ligeramente distintas. Se recomienda
empezar con amortización francesa mensual estándar (caso general, cubre hipotecas/préstamos
personales típicos) y ajustar la fórmula de la tarjeta de crédito cuando se tenga un estado de
cuenta real contra el cual validar los números — no adivinar el detalle fino sin un caso real de
referencia.
