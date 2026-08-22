# Módulo: Automatizaciones e Inteligencia Artificial

`automations` · Fase 4 (automatizaciones) — Fase 5 (IA, exploratorio)

## Automatizaciones

### Objetivo

Reglas simples "si → entonces" que se aplican automáticamente a transacciones nuevas — ej. "si
comercio = Walmart, entonces categoría = Alimentación" (el ejemplo del borrador original).

### Entidad: `AutomationRule`

```prisma
enum AutomationTriggerField {
  MERCHANT
  DESCRIPTION
  AMOUNT
  ACCOUNT
}

enum AutomationOperator {
  EQUALS
  CONTAINS
  GREATER_THAN
  LESS_THAN
}

enum AutomationActionField {
  CATEGORY
  TAG
}

model AutomationRule {
  id              String                 @id @default(uuid())
  user_id         String
  name            String
  trigger_field   AutomationTriggerField
  trigger_operator AutomationOperator
  trigger_value   String
  action_field    AutomationActionField
  action_value    String                 // category_id o tag_id, según action_field
  priority        Int                    @default(0)
  is_active       Boolean                @default(true)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?

  @@map("automation_rules")
}
```

### Reglas de negocio

**Se aplican al crear una transacción**, como un paso dentro de (o inmediatamente después de)
`create-transaction` — nunca de forma retroactiva por defecto. Reclasificar el historial existente
es una acción explícita separada (`bulk-apply-automation-rules`), para que el usuario no se
encuentre transacciones pasadas cambiando de categoría sin haberlo pedido.

**Cuando varias reglas matchean la misma transacción**, se aplica la de mayor `priority` (un único
ganador) — no se combinan acciones de reglas distintas, para mantener el comportamiento predecible.

**Motor de reglas simple a propósito:** una condición por regla (`trigger_field` +
`trigger_operator` + `trigger_value`). Reglas compuestas (varias condiciones con AND/OR) se dejan
para si el caso de uso simple resulta insuficiente en la práctica — no se construyen de forma
especulativa.

### Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-automation-rule` | Command |
| `update-automation-rule` | Command |
| `delete-automation-rule` | Command |
| `list-automation-rules` | Query |
| `apply-automation-rules` | (interno, invocado por `create-transaction`) |
| `bulk-apply-automation-rules` | Command (explícito, sobre historial existente) |

### Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/automation-rules` | Lista |
| POST | `/api/finance/automation-rules` | Crear regla |
| PATCH | `/api/finance/automation-rules/:id` | Actualizar |
| DELETE | `/api/finance/automation-rules/:id` | Borrar |
| POST | `/api/finance/automation-rules/bulk-apply` | Aplicar sobre historial |

### Frontend

`AutomationRulesListView` (constructor visual "Si… Entonces…"). Composable `useAutomationRules`.

---

## Inteligencia Artificial (fase 5 — exploratoria, no comprometida)

Las siguientes funciones del borrador original **no se construyen ahora**. Se documentan aquí para
que las decisiones de modelado de datos actuales (fases 1-4) no las bloqueen involuntariamente:

**Clasificación automática de transacciones** — un modelo que aprenda de las categorizaciones
manuales del usuario y complemente/reemplace las reglas de automatización basadas en condiciones
fijas. Requiere suficiente historial categorizado del propio usuario para ser útil.

**OCR para recibos** — extraer monto, fecha y comercio de una foto de recibo. Probablemente
requiere procesamiento asíncrono (no bloquear el request de subida) — candidato natural para
introducir BullMQ + Redis cuando se construya (ver
[02 — Stack tecnológico](../02-stack-tecnologico.md)).

**Detección de gastos inusuales** — detección de anomalías sobre el historial de transacciones.

**Predicción de flujo de caja y de saldo mensual** — proyección basada en series de tiempo del
historial de transacciones e ingresos/pagos recurrentes conocidos.

**Recomendaciones de ahorro** y **detección de suscripciones olvidadas** — cruce entre
[Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md) activos y el uso real observado en
[Transacciones](./02-transacciones.md).

### Decisión pendiente antes de construir cualquiera de estas

Elegir entre entrenar/mantener modelos propios vs. delegar a una API de IA (ej. un modelo de
lenguaje) para clasificación/extracción — esto determina si se necesita infraestructura de ML propia
o "solo" llamadas a una API externa con manejo de costos y latencia. No se resuelve en este
documento porque depende de cuánto historial de datos reales exista para entonces.
