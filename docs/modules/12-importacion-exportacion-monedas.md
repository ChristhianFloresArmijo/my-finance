# Módulo: Importación, Exportación y Monedas

`import_export` + `currencies` · Fase 2

## Objetivo

Importar transacciones desde CSV, Excel, OFX o QIF; exportar toda la información financiera;
soportar múltiples monedas con conversión automática mediante tipos de cambio.

## Entidades

```prisma
enum ImportFormat {
  CSV
  EXCEL
  OFX
  QIF
}

enum ImportJobStatus {
  PENDING
  PROCESSING
  COMPLETED
  FAILED
}

model ImportJob {
  id              String          @id @default(uuid())
  user_id         String
  account_id      String          // cuenta destino de las transacciones importadas
  source_format   ImportFormat
  file_reference  String          // clave de almacenamiento (IStorageProvider ya existente)
  job_status      ImportJobStatus @default(PENDING)
  imported_count  Int             @default(0)
  duplicate_count Int             @default(0)
  error_count     Int             @default(0)
  error_details   Json?

  created_at   DateTime  @default(now())
  completed_at DateTime?

  @@map("import_jobs")
}

enum ExchangeRateSource {
  MANUAL
  API
}

model Currency {
  code           String  @id @db.Char(3)  // ISO 4217, ej. "HNL", "USD", "EUR"
  name           String
  symbol         String
  decimal_places Int     @default(2)

  @@map("currencies")
}

model ExchangeRate {
  id            String             @id @default(uuid())
  from_currency String             @db.Char(3)
  to_currency   String             @db.Char(3)
  rate          Decimal            @db.Decimal(18, 8)
  as_of_date    DateTime
  source        ExchangeRateSource @default(MANUAL)

  created_at DateTime @default(now())

  @@unique([from_currency, to_currency, as_of_date])
  @@map("exchange_rates")
}
```

`Currency` se siembra con un conjunto inicial (lempiras, dólares, euros — los del borrador original)
y el usuario puede agregar más desde configuración.

## Reglas de negocio — importación

**El mapeo de columnas es obligatorio para CSV/Excel** (cada banco exporta con columnas distintas):
el flujo es subir archivo → mapear columnas a campos (`date`, `amount`, `description`, `merchant`,
`category` opcional) → previsualizar → confirmar. OFX y QIF tienen estructura estándar, así que se
parsean directamente sin paso de mapeo manual.

**Detección de duplicados antes de confirmar.** Antes de crear las transacciones definitivas, el
sistema marca como "posible duplicado" cualquier fila que coincida en cuenta + fecha + monto +
descripción con una transacción ya existente, y dorja al usuario decidir por fila si importar o
descartar — nunca se crean duplicados de forma silenciosa.

**El job queda registrado** (`ImportJob`) con conteo de importadas, duplicadas y con error, para que
el usuario pueda revisar qué pasó después del hecho.

## Reglas de negocio — exportación

Reutiliza el mecanismo de [Reportes](./11-reportes-y-estadisticas.md#reportes-fase-1--básico) pero
sobre datos crudos (todas las transacciones, no agregadas) en CSV, Excel o PDF.

## Reglas de negocio — monedas

Cada cuenta/transacción guarda su propia moneda (ver
[04 — Modelo de dominio y convenciones](../04-modelo-de-dominio-y-convenciones.md)). Para mostrar
totales agregados en una sola moneda (dashboard, patrimonio neto), se convierte usando el
`ExchangeRate` más reciente hacia la `base_currency` del usuario (campo a agregar en
`UserPreferences`). La carga de tipos de cambio es **manual** en el MVP — una integración con una
API de tipos de cambio para actualizarlos automáticamente vía un job programado es una mejora
opcional, no un bloqueante.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `start-import-job` | Command (sube archivo, crea el `ImportJob`) |
| `map-import-columns` | Command (CSV/Excel) |
| `preview-import` | Query (filas + duplicados detectados, antes de confirmar) |
| `commit-import` | Command (crea las transacciones definitivas) |
| `get-import-job-status` | Query |
| `export-transactions` | Query (CSV/Excel/PDF) |
| `list-currencies` | Query |
| `create-exchange-rate` | Command (manual) |
| `get-latest-exchange-rate` | Query |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| POST | `/api/finance/import` | Subir archivo, crear job |
| POST | `/api/finance/import/:id/mapping` | Mapear columnas (CSV/Excel) |
| GET | `/api/finance/import/:id/preview` | Previsualizar con duplicados marcados |
| POST | `/api/finance/import/:id/commit` | Confirmar importación |
| GET | `/api/finance/export?format=csv\|xlsx\|pdf` | Exportar todo |
| GET | `/api/finance/currencies` | Lista de monedas |
| POST | `/api/finance/exchange-rates` | Registrar tipo de cambio manual |

## Frontend

`ImportWizardView` (subir → mapear → previsualizar/deduplicar → confirmar, pasos secuenciales),
`ExportView`, `CurrenciesSettingsView` (tipos de cambio). Composables `useImport`, `useExport`,
`useCurrencies`.

## Relaciones con otros módulos

Crea [Transacciones](./02-transacciones.md). Usa [Cuentas](./01-cuentas.md) como destino. Alimenta
la conversión en [Patrimonio neto](./08-activos-y-patrimonio.md) y [Dashboard](./14-dashboard.md).

## Decisiones abiertas

**Parsers de OFX/QIF.** Evaluar librerías Node existentes al momento de construir (no bloquea el
diseño de datos). **Fuente automática de tipos de cambio** (API externa vía job programado) se
difiere a fase 5 — el MVP funciona con carga manual, suficiente para uso personal.
