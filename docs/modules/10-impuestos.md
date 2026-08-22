# Módulo: Impuestos

`taxes` · Fase 4

## Objetivo

Calcular y planificar obligaciones fiscales: registrar tipos de impuestos, pagos realizados,
obligaciones futuras, saldo pendiente e historial de declaraciones.

## Alcance explícito: qué SÍ y qué NO hace este módulo

**Sí:** ayuda a *rastrear y planificar* montos que el usuario mismo estima o calcula fuera de la
aplicación (con su contador, o con una calculadora externa), recordar fechas límite, y llevar
historial de pagos parciales/totales.

**No:** este módulo no calcula impuestos legalmente exactos ni conoce la legislación fiscal de
ninguna jurisdicción. Las reglas fiscales (renta, IVA, ganancias de capital) varían por país y
cambian con el tiempo — modelarlas dentro de la aplicación estaría fuera de alcance y sería
información financiera que Claude, como asistente, no puede certificar como correcta. Cualquier
"estimación" que ofrezca el sistema es una proyección aritmética simple sobre datos que el propio
usuario ingresa (ej. "% configurable sobre ingresos gravables"), no asesoría fiscal.

## Entidades

```prisma
enum TaxType {
  INCOME_TAX
  MUNICIPAL
  VAT
  CAPITAL_GAINS
  OTHER
}

enum TaxObligationStatus {
  PENDING
  PARTIALLY_PAID
  PAID
  OVERDUE
}

model TaxObligation {
  id               String              @id @default(uuid())
  user_id          String
  type             TaxType
  name             String              // ej. "Declaración de renta 2026"
  fiscal_year      Int
  due_date         DateTime
  estimated_amount Decimal             @db.Decimal(18, 4)
  currency_code    String              @db.Char(3)
  obligation_status TaxObligationStatus @default(PENDING)
  notes            String?

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?

  payments TaxPayment[]

  @@map("tax_obligations")
}

model TaxPayment {
  id                String   @id @default(uuid())
  tax_obligation_id String
  date              DateTime
  amount            Decimal  @db.Decimal(18, 4)
  transaction_id    String?
  notes             String?

  created_at DateTime @default(now())

  tax_obligation TaxObligation @relation(fields: [tax_obligation_id], references: [id], onDelete: Cascade)
  transaction    Transaction?  @relation(fields: [transaction_id], references: [id])

  @@map("tax_payments")
}
```

## Reglas de negocio

**Saldo pendiente** = `estimated_amount − Σ TaxPayment.amount`. `obligation_status` se recalcula
automáticamente al registrar un pago: `PAID` cuando el saldo llega a cero, `PARTIALLY_PAID` si hay
pagos pero saldo > 0, `OVERDUE` si `due_date` ya pasó y el saldo sigue > 0 (chequeado por el mismo
job diario que revisa [Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md)).

**"Cuánto reservar mensualmente"** = saldo pendiente ÷ meses restantes hasta `due_date` — cálculo
aritmético simple, no una recomendación fiscal.

**Reportes fiscales** son agregaciones de `TaxObligation`/`TaxPayment`: impuestos pagados por año,
impuestos pendientes, pagos realizados, historial de declaraciones.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-tax-obligation` | Command |
| `update-tax-obligation` | Command |
| `register-tax-payment` | Command |
| `list-tax-obligations` | Query |
| `get-tax-summary-by-year` | Query |
| `get-monthly-reserve-recommendation` | Query (cálculo aritmético, no fiscal) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/taxes` | Lista de obligaciones |
| POST | `/api/finance/taxes` | Crear obligación |
| PATCH | `/api/finance/taxes/:id` | Actualizar |
| POST | `/api/finance/taxes/:id/payments` | Registrar pago |
| GET | `/api/finance/taxes/summary?year=` | Reporte fiscal por año |

## Frontend

`TaxesListView`, `TaxDetailView` (historial de pagos). Composable `useTaxes`.

## Relaciones con otros módulos

Sus vencimientos alimentan el [Calendario financiero](./09-pagos-recurrentes-y-calendario.md). Sus
pagos pueden originarse de una [Transacción](./02-transacciones.md). Visible en
[Reportes](./11-reportes-y-estadisticas.md) y [Dashboard](./14-dashboard.md).

## Decisiones abiertas

Ninguna de modelado — la decisión relevante ya está resuelta arriba: el sistema no calcula
impuestos, solo los rastrea y planifica sobre montos que el usuario provee.
