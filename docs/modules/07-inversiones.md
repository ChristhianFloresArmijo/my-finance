# Módulo: Inversiones

`investments` · Fase 3

## Objetivo

Registrar acciones, ETFs, fondos, bonos, criptomonedas y bienes raíces de inversión, con su
rendimiento, ganancias, dividendos y rentabilidad.

## Entidades

```prisma
enum InvestmentType {
  STOCK
  ETF
  FUND
  BOND
  CRYPTO
  REAL_ESTATE
}

enum InvestmentTxType {
  BUY
  SELL
  DIVIDEND
}

model Investment {
  id            String         @id @default(uuid())
  user_id       String
  account_id    String?        // FinancialAccount de tipo INVESTMENT, opcional
  type          InvestmentType
  symbol        String?        // ticker, si aplica (acciones/ETF/cripto)
  name          String
  currency_code String         @db.Char(3)
  current_price Decimal?       @db.Decimal(18, 8)   // actualización manual en MVP — ver decisiones
  current_price_updated_at DateTime?

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?

  account      FinancialAccount?       @relation(fields: [account_id], references: [id])
  transactions InvestmentTransaction[]

  @@map("investments")
}

model InvestmentTransaction {
  id             String           @id @default(uuid())
  investment_id  String
  type           InvestmentTxType
  quantity       Decimal?         @db.Decimal(28, 8)  // null para DIVIDEND
  price_per_unit Decimal?         @db.Decimal(18, 8)  // null para DIVIDEND
  amount         Decimal          @db.Decimal(18, 4)  // total, incluye DIVIDEND
  fees           Decimal?         @db.Decimal(18, 4)
  date           DateTime
  notes          String?

  created_at DateTime @default(now())

  investment Investment @relation(fields: [investment_id], references: [id], onDelete: Cascade)

  @@map("investment_transactions")
}
```

## Reglas de negocio

**Cantidad y costo base se derivan del historial, nunca se editan a mano.** `quantity` en poder y
`avg_cost_basis` se calculan agregando `InvestmentTransaction` (`BUY` suma cantidad y costo,
`SELL` resta cantidad proporcionalmente al costo base promedio — método FIFO/promedio ponderado, a
elegir al implementar, documentado explícitamente en el handler).

**Cálculos derivados** (no almacenados): `market_value = quantity × current_price`;
`gain = market_value − cost_basis_total`; `return_pct = gain / cost_basis_total × 100`. Los
dividendos (`DIVIDEND`) suman al retorno total pero no afectan `quantity` ni el costo base.

**Actualización de precio de mercado.** `current_price` se actualiza manualmente en el MVP/fase 3
(el usuario lo edita cuando quiere refrescar el valor). No hay integración con ninguna API de
precios todavía — ver decisión abierta.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-investment` | Command |
| `record-buy` | Command |
| `record-sell` | Command |
| `record-dividend` | Command |
| `update-current-price` | Command |
| `list-investments-with-performance` | Query |
| `get-investment-detail` | Query (historial de transacciones) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/investments` | Lista con rendimiento calculado |
| POST | `/api/finance/investments` | Registrar nueva inversión |
| GET | `/api/finance/investments/:id` | Detalle + historial |
| POST | `/api/finance/investments/:id/transactions` | Compra, venta o dividendo |
| PATCH | `/api/finance/investments/:id/price` | Actualizar precio actual |

## Frontend

`InvestmentsListView` (tabla con rendimiento %, ganancia, valor de mercado), `InvestmentDetailView`
(historial de compra/venta/dividendos). Composable `useInvestments`.

## Relaciones con otros módulos

Puede vincularse a una [Cuenta](./01-cuentas.md) de tipo `INVESTMENT`. Es activo en
[Patrimonio neto](./08-activos-y-patrimonio.md). Insumo de
[Reportes y estadísticas](./11-reportes-y-estadisticas.md).

## Decisiones abiertas

**Actualización automática de precios.** Se difiere a la fase 5 (junto con IA/integraciones) una
posible integración con una API de precios de mercado vía un job programado — no se construye de
forma especulativa en el MVP de este módulo.

**Bienes raíces: ¿Inversión o Activo?** El borrador original lista "Bienes raíces" tanto en
Inversiones como (con el nombre "Casas") en Activos. Regla recomendada para no duplicar el mismo
inmueble en los dos módulos: una propiedad que se sigue por rentabilidad/renta va en
**Inversiones**; una propiedad de uso personal (la vivienda donde vive el usuario) va en
[Activos](./08-activos-y-patrimonio.md). Esta distinción debe quedar clara en la UI al momento de
registrar una propiedad.
