# Módulo: Reportes y Estadísticas

`reports` · Fase 1 (versión básica) → Fase 4 (versión avanzada)

## Objetivo

Consolidar el borrador original "13. Reportes" y "25. Estadísticas" en un solo módulo: no introduce
entidades propias, es una capa de consulta/agregación que lee de todos los módulos financieros.

## Sin entidades propias (por ahora)

Este módulo no tiene tablas propias en el MVP — todas sus queries agregan datos de
[Transacciones](./02-transacciones.md) (y, conforme existan, de
[Presupuestos](./04-presupuestos.md), [Metas](./05-metas-de-ahorro.md),
[Deudas](./06-deudas.md), [Inversiones](./07-inversiones.md) y
[Patrimonio](./08-activos-y-patrimonio.md)). Si más adelante se necesita guardar configuraciones de
reporte reutilizables (ej. "mi reporte mensual de gastos de trabajo"), se añadiría un modelo
`SavedReportFilter` — no es necesario para el MVP.

## Reportes (fase 1 — básico)

Por categoría, cuenta, etiqueta, comercio, mes o año. Exportables en PDF, Excel y CSV.

**Filtros combinables**, igual que la búsqueda avanzada de
[Transacciones](./02-transacciones.md#reglas-de-negocio) — de hecho reutilizan el mismo query de
filtrado, solo cambia la forma de presentación (tabular/agregada vs. lista de movimientos) y el
formato de salida.

## Estadísticas (fase 4 — avanzado)

Gasto promedio diario, ahorro promedio, categoría con mayor gasto, comercio con mayor gasto,
evolución del patrimonio, flujo de caja, balance mensual. Cada indicador es una query de agregación
independiente — se construyen incrementalmente, no hace falta completarlos todos a la vez.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `generate-report` | Query (parámetros: alcance, periodo, agrupación) |
| `export-report` | Query (mismo resultado que `generate-report`, en CSV/Excel/PDF) |
| `get-statistics-summary` | Query (indicadores de la fase 4) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/reports` | Reporte agregado según filtros |
| GET | `/api/finance/reports/export?format=csv\|xlsx\|pdf` | Exportar el mismo reporte |
| GET | `/api/finance/statistics` | Indicadores estadísticos |

## Frontend

`ReportsView` (filtros + tabla + botón de exportar), `StatisticsView` (tarjetas de indicadores +
gráficas ECharts). Composables `useReports`, `useStatistics`.

## Relaciones con otros módulos

Consumidor transversal — lee de prácticamente todos los módulos financieros según van existiendo.
Comparte lógica de filtrado con [Transacciones](./02-transacciones.md).

## Decisiones abiertas

**Librerías de exportación.** Excel y PDF requieren una librería en el backend (Node) — se elige al
momento de construir el caso de uso (ej. `exceljs` para Excel; para PDF, generar desde una plantilla
HTML o usar una librería como `pdfkit`). Es una decisión de implementación, no de modelo de datos, y
no debe bloquear el resto del módulo.
