# Módulo: Activos y Patrimonio Neto

`net_worth` · Fase 3

## Objetivo

Registrar activos personales de uso propio (casas, terrenos, vehículos, computadoras, teléfonos,
negocios, equipos) y calcular automáticamente el patrimonio neto (`Activos − Pasivos`), mostrando
su evolución histórica.

## Entidades

```prisma
enum AssetType {
  REAL_ESTATE
  VEHICLE
  ELECTRONICS
  BUSINESS
  EQUIPMENT
  OTHER
}

model Asset {
  id                String    @id @default(uuid())
  user_id           String
  type              AssetType
  name              String
  purchase_value    Decimal   @db.Decimal(18, 4)
  current_value     Decimal   @db.Decimal(18, 4)
  purchase_date     DateTime
  depreciation_rate Decimal?  @db.Decimal(9, 6)   // % anual, opcional
  currency_code     String    @db.Char(3)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?

  @@map("assets")
}

model NetWorthSnapshot {
  id                String   @id @default(uuid())
  user_id           String
  date              DateTime
  total_assets      Decimal  @db.Decimal(18, 4)
  total_liabilities Decimal  @db.Decimal(18, 4)
  net_worth         Decimal  @db.Decimal(18, 4)

  created_at DateTime @default(now())

  @@unique([user_id, date])
  @@map("net_worth_snapshots")
}
```

## Reglas de negocio

**Patrimonio Neto = Activos − Pasivos, calculado en vivo para "ahora".** La consulta agrega:

- Activos: saldos positivos de [Cuentas](./01-cuentas.md) (bancarias, efectivo, ahorro), valor de
  mercado de [Inversiones](./07-inversiones.md), `current_value` de cada `Asset`.
- Pasivos: saldo usado de tarjetas de crédito, `current_balance` de cada
  [Deuda](./06-deudas.md) activa.

**La evolución histórica se basa en snapshots, no en recálculo retroactivo.** Un job programado
(`@nestjs/schedule`, frecuencia mensual recomendada para el MVP) calcula el patrimonio neto del día
y guarda una fila en `NetWorthSnapshot`. La gráfica de evolución lee esta tabla — **no** se puede
reconstruir con precisión el patrimonio de fechas anteriores a que existan snapshots, porque el
valor de activos (ej. plusvalía de una casa) cambia sin que quede un registro de transacción que lo
explique. Esta limitación debe comunicarse en la UI ("el histórico empieza a partir de que activas
este módulo"), no prometerse como retroactivo.

**Depreciación** es opcional (`depreciation_rate`); cuando está presente, `current_value` puede
recalcularse periódicamente (mismo job de snapshot, o uno propio) usando depreciación lineal simple.
Si no se define, `current_value` se actualiza solo manualmente.

**No duplicar el mismo dinero como dos activos.** Si una `SavingsGoal` tiene `linked_account_id`,
su progreso ya está contado como el saldo de esa cuenta — no se suma aparte (ver
[Metas de ahorro](./05-metas-de-ahorro.md)).

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-asset` | Command |
| `update-asset` | Command |
| `delete-asset` | Command |
| `list-assets` | Query |
| `get-net-worth-summary` | Query (activos/pasivos/patrimonio neto, ahora) |
| `get-net-worth-history` | Query (lee `NetWorthSnapshot`) |
| `compute-net-worth-snapshot` | Scheduler (`@Cron`, mensual) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/assets` | Lista de activos |
| POST | `/api/finance/assets` | Crear activo |
| PATCH | `/api/finance/assets/:id` | Actualizar |
| DELETE | `/api/finance/assets/:id` | Borrar |
| GET | `/api/finance/net-worth` | Resumen actual (activos, pasivos, patrimonio neto) |
| GET | `/api/finance/net-worth/history` | Serie histórica para gráfica |

## Frontend

`AssetsListView`, `NetWorthView` (número grande + gráfica de evolución con ECharts). Composables
`useAssets`, `useNetWorth`.

## Relaciones con otros módulos

Agrega datos de [Cuentas](./01-cuentas.md), [Inversiones](./07-inversiones.md) y
[Deudas](./06-deudas.md). Visible en [Dashboard](./14-dashboard.md) ("patrimonio neto",
"evolución del patrimonio").

## Decisiones abiertas

**Frecuencia del snapshot.** Mensual para el MVP; evaluar diario solo si se necesita una gráfica más
granular — no hay razón para más frecuencia sin ese requisito concreto.
