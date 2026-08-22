# Módulo: Dashboard

`dashboard` · Fase 1 (versión básica) → crece hasta Fase 4

## Objetivo

Pantalla principal con el resumen financiero completo del usuario. No introduce entidades propias
ni reglas de negocio nuevas: es una capa de orquestación que agrega resúmenes ya calculados por cada
módulo.

## Contenido (del borrador original)

**Indicadores:** balance total, dinero disponible, ingresos del mes, gastos del mes, flujo de caja,
ahorro mensual, patrimonio neto, presupuesto utilizado, próximos pagos, próximos vencimientos, metas
de ahorro, deudas pendientes, valor de inversiones.

**Gráficas:** ingresos vs. gastos, evolución del patrimonio, flujo de caja, gastos por categoría,
evolución del ahorro (todas con ECharts, ver [02 — Stack tecnológico](../02-stack-tecnologico.md)).

## Por qué crece por fases en vez de construirse todo de una vez

El dashboard **básico** (balance, ingresos/gastos del mes, flujo de caja, gastos por categoría) solo
depende de [Cuentas](./01-cuentas.md) y [Transacciones](./02-transacciones.md) — es fase 1 (MVP). El
resto de tarjetas (presupuesto utilizado, metas, deudas, inversiones, patrimonio neto) se agregan
incrementalmente conforme esos módulos existan (fases 2-3) — no tiene sentido bloquear todo el
dashboard hasta que el proyecto entero esté terminado.

## Diseño recomendado: un endpoint agregador, no N llamadas desde el frontend

`get-dashboard-summary` es una única Query en el backend que internamente invoca los queries de
resumen que cada módulo ya expone (`get-net-worth-summary`, `list-budgets-with-progress`,
`get-financial-calendar`, `list-goals-with-progress`, `list-debts`,
`list-investments-with-performance`, agregación mensual de `Transaction`). No repite lógica de
negocio — delega y combina. Esto evita que el frontend tenga que hacer una decena de peticiones
paralelas cada vez que se abre la pantalla principal.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `get-dashboard-summary` | Query (orquesta queries de otros módulos) |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/dashboard` | Resumen completo para la pantalla principal |

## Frontend

`DashboardView` (grid de tarjetas de indicadores + gráficas ECharts). Composable `useDashboard`.

## Relaciones con otros módulos

Consume el resumen de prácticamente todos los módulos financieros — ver tabla de dependencias en
[05 — Estado actual y roadmap](../05-estado-actual-y-roadmap.md) para saber qué tarjetas ya se
pueden mostrar en cada fase.

## Decisiones abiertas

Ninguna — es orquestación pura sobre queries que ya existen en cada módulo fuente.
