# Revisión del schema de Prisma — 2026-09-07

Alcance: `apps/api/src/database/prisma/schema.prisma`, después de correr `prisma format`. Cubre los
modelos del dominio financiero agregados sobre la base de identidad/RBAC ya existente.

## Estado — verificado contra el schema actualizado

Los 8 hallazgos de abajo ya están corregidos en el schema actual y los volví a chequear uno por uno
contra el archivo que subiste: ✅ los 8. No encontré regresiones ni nada roto por los cambios. Al
final agregué una sección **"Verificación posterior"** con dos observaciones menores (cosméticas, no
bloqueantes) y una sugerencia nueva opcional.

## Hallazgos

### 1. Bug de convención — `Document.transactionId` ✅ Corregido

- **Dónde:** modelo `Document`, campo `transactionId` (línea ~353).
- **Problema:** es el único FK de todo el archivo en camelCase — el resto (`account_id`,
  `category_id`, `debt_id`, `goal_id`, etc.) es snake_case. Como no tiene `@@map`, la columna real en
  Postgres se llamaría literalmente `transactionId`, distinto a como se llaman todas las demás FKs.
- **Fix:** renombrar a `transaction_id` (y su referencia en `@relation(fields: [...])`).

### 2. Nombres de relación inconsistentes (camelCase vs. snake_case) ✅ Corregido

- **Dónde:** `User.financialAccounts`; `FinancialAccount.savingsGoals` / `.debts` / `.investments` /
  `.recurringPayments`; `Transaction.goalContributions` / `.debtPayments` / `.taxPayments`.
  Comparar con `transaction_tags`, `linked_account`, `financial_account`, `tax_obligation`, que sí
  están en snake_case.
- **Por qué importa:** el doc de convenciones (`04-modelo-de-dominio-y-convenciones.md`) pide
  "nombres de campo en snake_case", y los modelos originales de `account`/RBAC (`user_roles`,
  `role_permissions`, `direct_permissions`) sí lo siguen. Los modelos financieros nuevos, no.
- **Fix:** normalizar todos los campos de relación a snake_case.

### 3. Falta `status: Status` genérico ✅ Corregido (y el nombre del enum de dominio, renombrado)

- **Modelos afectados:** `Asset`, `Debt`, `Investment`, `TaxObligation`.
- **Por qué importa:** el doc dice que `Status` se usa "además de" el enum de dominio propio de cada
  modelo, no en su lugar. `Debt` tiene `debt_status` pero no `status`; mismo patrón en los otros tres.
  `FinancialAccount` y `Category` sí lo tienen — la inconsistencia es real.
- **Fix:** agregar `status Status @default(ACTIVE)` a los cuatro modelos.
- **Nota sobre el nombre del enum de dominio (a raíz de comentario en revisión):** `debt_status`
  dentro del modelo `Debt` es redundante — repite el nombre de la entidad en la que ya está. Mismo
  problema en `TaxObligation.obligation_status`. Mejor heurística: nombrar el campo por *qué
  dimensión rastrea*, no por la entidad a la que pertenece (eso ya lo sabemos por estar dentro del
  modelo). Con esa heurística:
  - `Debt.debt_status` (`ACTIVE`/`PAID_OFF`/`DEFAULTED`) → `repayment_status` (rastrea el progreso
    de pago de la deuda).
  - `TaxObligation.obligation_status` (`PENDING`/`PARTIALLY_PAID`/`PAID`/`OVERDUE`) →
    `payment_status` (mismo tipo de dimensión: progreso de pago).
  - Esto es un ajuste de nombre, no bloqueante — si preferís mantener `debt_status`/
    `obligation_status` tal como están, dímelo y lo revierto; son sinónimos válidos, solo un poco
    más redundantes.

### 4. Colisión de nombre en `SavingsGoal` ✅ Corregido

- **Dónde:** `SavingsGoal.status: GoalStatus` — el campo del enum de dominio ocupa el nombre que le
  correspondería al `Status` genérico, impidiendo tener los dos.
- **Comparar con:** `Debt.repayment_status` y `TaxObligation.payment_status` (ver nota en el hallazgo
  #3), que sí evitaron ese choque de nombres en el mismo archivo.
- **Fix:** renombrar a `progress_status: GoalStatus` (sigue la misma heurística: nombra la dimensión
  — progreso hacia la meta —, no la entidad), agregar `status: Status @default(ACTIVE)` aparte.

### 5. `is_active: Boolean` en vez de `Status` ✅ Corregido

- **Modelos:** `RecurringPayment`, `AutomationRule`.
- **Por qué importa:** mismo problema de fondo que el punto 3 — inconsistente con la convención, y
  pierde la integración gratuita con `GET /meta/enums` (labels i18n-ready) que ya sirve `Status`.
- **Fix (a discutir, no urgente):** reemplazar por `status: Status`.

### 6. Falta `base_currency` en `UserPreferences` ✅ Corregido

- **Por qué importa:** el roadmap (`05-estado-actual-y-roadmap.md`) decía agregar este campo "en la
  migración que introduzca el primer módulo financiero que lo necesite (dashboard/reportes)".
  `NetWorthSnapshot` — que agrega montos de distintas cuentas/monedas en un solo `net_worth` — es
  exactamente ese disparador, y el campo no está.
- **Fix:** agregar `base_currency String? @db.Char(3)` a `UserPreferences` — **nullable, sin default
  fijo en el schema.**
- **Por qué nullable y no un default como `HNL`/`USD` (decisión del autor, a raíz de revisión):** si
  el plan a futuro es abrir esto como SaaS multi-usuario, hardcodear cualquier moneda en el schema
  asume la respuesta por todos los usuarios que vengan después. Lo correcto es que cada usuario la
  elija (o se le sugiera automáticamente, ej. por locale del navegador) durante onboarding, y el
  campo se llene desde el frontend en ese momento — no en el default de la columna.
- **Implicación que esto sí obliga a resolver en código (no en el schema):** mientras
  `base_currency` sea `null` — usuario que no ha pasado por ese paso de onboarding — cualquier query
  que dependa de él (`get-net-worth-summary`, dashboard agregado en una sola moneda) necesita un
  camino explícito para ese caso: o se bloquea esa vista con un prompt ("configura tu moneda base
  para ver el patrimonio consolidado"), o se usa un fallback visible (ej. "mostrando en la moneda de
  tu cuenta con mayor saldo") — lo que **no** debería pasar es que el cálculo silenciosamente asuma
  una moneda y muestre un número incorrecto sin decir en base a qué se calculó.

### 7. Sugerencia — falta `@@index([user_id])` ✅ Corregido

- **Estado: ✅ Corregido** — confirmé los 17 modelos con `@@index([user_id])` en el schema actual.
- Ningún modelo del dominio financiero tiene índice explícito en `user_id`, a pesar de que toda query
  se filtra por ahí (regla del proyecto: "todo pertenece a un usuario").
- No urgente con un solo usuario hoy; sí antes de abrir el registro a terceros (fase de
  monetización/suscripciones).
- **Sintaxis:** agregar la línea `@@index([user_id])` dentro del modelo, junto a los demás
  atributos de bloque (`@@map`, `@@unique`, etc.) — el orden entre ellos no importa para Prisma,
  pero por convención suele ir justo arriba de `@@map(...)`.
- **Dónde exactamente (ya revisé el schema.prisma actual para armarte la lista, no hace falta que
  la busques):** estos son los únicos modelos que de verdad necesitan la línea nueva. Los que no
  aparecen aquí ya tienen un índice que empieza en `user_id` por venir de un `@@unique(...)`
  compuesto (Postgres puede usar ese índice para filtrar solo por `user_id` igual) — agregar uno
  aparte ahí sería redundante, no lo hagas.

  | Modelo | Tabla (`@@map`) | Agregar la línea justo arriba de |
  |---|---|---|
  | `UserRecoveryCode` | `user_recovery_codes` | `@@map("user_recovery_codes")` |
  | `RefreshToken` | `refresh_tokens` | `@@map("refresh_tokens")` |
  | `Category` | `categories` | `@@map("categories")` |
  | `Document` | `documents` | `@@map("documents")` |
  | `Transaction` | `transactions` | `@@map("transactions")` (la más importante — es la tabla más consultada) |
  | `FinancialAccount` | `financial_accounts` | `@@map("financial_accounts")` |
  | `Budget` | `budgets` | `@@map("budgets")` |
  | `SavingsGoal` | `savings_goals` | `@@map("savings_goals")` |
  | `Debt` | `debts` | `@@map("debts")` |
  | `Investment` | `investments` | `@@map("investments")` |
  | `Asset` | `assets` | `@@map("assets")` |
  | `RecurringPayment` | `recurring_payments` | `@@map("recurring_payments")` |
  | `TaxObligation` | `tax_obligations` | `@@map("tax_obligations")` |
  | `ImportJob` | `import_jobs` | `@@map("import_jobs")` |
  | `AutomationRule` | `automation_rules` | `@@map("automation_rules")` |
  | `Reminder` | `reminders` | `@@map("reminders")` |
  | `Notification` | `notifications` | `@@map("notifications")` |

  17 modelos en total. Buscá cada `@@map("...")` de la tabla (columna derecha) con Ctrl/Cmd+F en tu
  editor y pegá `@@index([user_id])` en la línea de arriba — es más confiable que ir por número de
  línea, porque cada inserción corre las líneas de lo que sigue.
- **No lo necesitan** (ya cubiertos por un `@@unique(...)` que empieza en `user_id`, o no tienen
  `user_id` propio): `UserProfile`, `UserPreferences`, `UserRole`, `UserPermission`, `Tag`,
  `NetWorthSnapshot`, `Subscription` — y los modelos ledger que se filtran por el id de su padre en
  vez de por usuario (`GoalContribution`, `DebtPayment`, `InvestmentTransaction`, `TaxPayment`), que
  quedan fuera del alcance de este hallazgo.
- Después de editar, corré `prisma format` (ya lo tenés como hábito) y `prisma migrate dev` para
  generar la migración con los índices nuevos.

### 8. Falta `deleted_at` en `GoalContribution` ✅ Corregido

- **Dónde:** modelo `GoalContribution` (`05-metas-de-ahorro.md`).
- **Problema:** a diferencia de `DebtPayment`/`InvestmentTransaction`/`TaxPayment`, `GoalContribution`
  sí tiene un caso de uso `remove-contribution` (Command) documentado — el usuario puede borrar un
  aporte. El modelo actual solo tiene `created_at`, sin `deleted_at`.
- **Por qué importa:** sin `deleted_at`, "borrar" un aporte solo puede implementarse como `DELETE`
  físico, lo que rompe cualquier necesidad futura de auditar "aportes que se hicieron y luego se
  revirtieron". De los cinco modelos tipo ledger del dominio (`DebtPayment`, `InvestmentTransaction`,
  `TaxPayment`, `ExchangeRate`, `GoalContribution`), este es el único cuyo doc pide explícitamente un
  comando de borrado — por eso es el único que sí necesita `deleted_at`.
- **Fix:** agregar `deleted_at DateTime?` **y** `status Status @default(ACTIVE)` a `GoalContribution`
  (no solo `deleted_at` — ver el porqué del `status` en la nota de abajo, sección "¿y updated_at?").
  `updated_at` sí se queda fuera: no hay ningún `update-contribution` documentado, solo
  `remove-contribution`.
- **`update-contribution`, ¿se agrega o no?** Se planteó explícitamente al revisar este hallazgo.
  Técnicamente editar un aporte manual (sin `transaction_id`) no corrompería nada — el progreso de
  la meta se recalcula sumando en vivo, no es un balance que se decrementa como en `Debt`. Aun así,
  se decidió mantenerlo inmutable (solo `create` + `remove`, como está hoy) por consistencia con el
  resto del ledger y para no tener que distinguir el caso especial de un aporte con `transaction_id`
  seteado (editar el monto ahí sí generaría una inconsistencia con la `Transaction` real ya
  registrada). Para corregir un aporte mal cargado: borrarlo y crear uno nuevo.

## Nota: ¿por qué no todos los modelos tienen los 4 campos de auditoría?

Surgió como pregunta al revisar este documento, y vale la pena dejar la respuesta registrada aquí:
no es un descuido parejo, es una decisión de diseño que ya estaba implícita en cada
`docs/modules/*.md`, solo que no la había hecho explícita en la revisión original.

Los 4 campos no son un checklist uniforme — cada uno responde una pregunta de negocio distinta:

- `created_at`: siempre. Toda fila necesita saber cuándo se creó.
- `updated_at`: ¿esta fila se puede editar después de creada?
- `deleted_at`: ¿esta fila se puede borrar (soft-delete) después de creada?
- `status` genérico: ¿esta fila tiene un ciclo de vida con más de dos estados (no solo
  activo/borrado — por ejemplo, puede pausarse o suspenderse)?

Para responder eso no hace falta adivinar: cada módulo documenta su tabla de "Casos de uso", y ahí
dice literalmente qué comandos existen. Separan en dos grupos claros:

**Entidades "vivas" (tienen `create` + `update` + `delete`)** → necesitan el scaffold completo,
incluyendo `status` genérico — esto es exactamente el hallazgo #3 de arriba, ahora confirmado
contra los docs de cada módulo:

- `Asset` (`update-asset`, `delete-asset`)
- `Debt` (`update-debt`, `delete-debt`)
- `TaxObligation` (`update-tax-obligation`)
- `SavingsGoal` (ya tiene el scaffold completo)

**Filas de historial/ledger (solo tienen `register-x` o `record-x`, nunca `update-x` ni
`delete-x`)** → correctamente no deberían tener `updated_at` ni `status`, ni tampoco `deleted_at`,
porque los propios docs dicen explícitamente que son inmutables:

- `DebtPayment` — doc: "nunca se edita `current_balance` directamente [desde aquí]"; casos de uso:
  solo `register-payment`, `register-extra-principal-payment`.
- `InvestmentTransaction` — doc: "se derivan del historial, nunca se editan a mano"; casos de uso:
  solo `record-buy`/`record-sell`/`record-dividend`.
- `TaxPayment` — casos de uso: solo `register-tax-payment`.
- `ExchangeRate` — casos de uso: solo `create-exchange-rate` (manual). Es un hecho histórico ("el
  tipo de cambio era X en la fecha Y"), no algo que se corrija después.
- `NetWorthSnapshot` — solo se crea vía `@Cron`, nunca por acción directa del usuario.
- `ImportJob` — `created_at` + `completed_at` únicamente; su `job_status` lo cambia el propio
  sistema (`PENDING → PROCESSING → COMPLETED/FAILED`), no un comando de usuario que "edite" la fila.

Si se le agregara `updated_at` a `DebtPayment` o `InvestmentTransaction`, el problema no sería solo
el campo de más — sería decirle a cualquier desarrollador futuro (incluyéndote a ti mismo en 6
meses) "esta fila se puede editar", cuando la regla de negocio documentada dice exactamente lo
contrario: la única forma correcta de corregir un pago mal registrado es crear una fila
compensatoria nueva, para no perder el rastro de auditoría de lo que realmente pasó. Agregar el
campo sin un caso de uso real que lo use sería además puro YAGNI.

**`GoalContribution` es la única excepción dentro del grupo "ledger"**, porque su doc sí define un
`remove-contribution` — de ahí el hallazgo #8. Pero esa excepción trae dos preguntas separadas, que
vale la pena no mezclar:

**¿Necesita `status` genérico, no solo `deleted_at`? Sí** (corregido en el hallazgo #8). La
convención del proyecto (`04-modelo-de-dominio-y-convenciones.md`) no dice "agregá `status` solo si
el modelo tiene varios estados de dominio que lo justifiquen" — dice que el soft-delete de este
proyecto **se implementa con los dos campos juntos**, `deleted_at` + `status`, como una unidad. No
es que `status` le sume información nueva a `GoalContribution` hoy (no hay un caso de uso de
"pausar" o "suspender" un aporte) — es que en este proyecto, "esta fila se puede borrar" siempre se
expresa con ambos campos a la vez, para que herramientas genéricas (`GET /meta/enums`, un repositorio
base de soft-delete, un admin panel futuro) puedan asumir esa forma en cualquier modelo sin casos
especiales. Este es el mismo error que cometí en la revisión original: traté `status` como "opcional
salvo que haya estados ricos que lo justifiquen", cuando la convención ya escrita dice que va pegado
a `deleted_at` siempre. Gracias por insistir en esto — corrige tanto el hallazgo #8 como, en
retrospectiva, confirma que el hallazgo #3 estaba bien encaminado por la razón correcta.

**¿Necesita `updated_at` también, ya que "borrar cuenta como una actualización"? No, y esto sí es un
eje distinto al de arriba.** Técnicamente tenés razón en que un `UPDATE ... SET deleted_at = now()`
es, a nivel de SQL, una actualización de la fila. Pero `updated_at` como campo de auditoría no
existe para responder "¿se ejecutó algún `UPDATE` sobre esta fila alguna vez?" — existe para
responder "¿cuál fue la ÚLTIMA vez que cambió algo, y necesito distinguir eso del momento en que se
borró?". Esa pregunta solo tiene sentido cuando el borrado y la edición son dos eventos
*independientes* que pueden pasar en momentos distintos (ej. `Debt`: editás el `interest_rate` tres
veces a lo largo de un año, y quizás la borrás mucho después — `updated_at` y `deleted_at` cuentan
historias distintas ahí). En `GoalContribution`, el único evento posible después de crear la fila
ES el borrado — no existe ningún `update-contribution` documentado que cambie `amount`, `date` o
`notes` manteniendo la fila viva. Si le agregaras `updated_at`, su valor sería siempre `null` o
*exactamente igual* a `deleted_at` — nunca aportaría un dato que `deleted_at` no diera ya. Agregarlo
sería una columna que existe solo para parecerse a las demás, no porque codifique algo real; si
mañana aparece un `update-contribution` real en el doc, ahí sí se agrega, con esa justificación.

Esto también deja una regla más limpia que la de la nota original, y que sirve para cualquier
modelo nuevo que armes de acá en adelante — la misma metodología caso-por-caso que ya venías usando,
solo que ahora separando bien los dos ejes:

1. `created_at` — siempre.
2. ¿Hay un comando `delete-x`/`remove-x` documentado? → agregá `deleted_at` **y** `status` juntos
   (son una unidad en este proyecto, no dos decisiones independientes).
3. ¿Hay un comando `update-x` documentado que edite campos sin borrar la fila? → agregá `updated_at`.
4. Si no hay ni `delete-x` ni `update-x` documentados → la fila es pura historia/ledger: solo
   `created_at`, nada más.

Vale la pena copiar esta regla a `04-modelo-de-dominio-y-convenciones.md` para no tener que
re-derivarla cada vez que agregues un modelo nuevo — avisame si querés que te arme el texto para esa
sección.

## Verificación posterior (contra el schema que subiste después de los cambios)

**Dos observaciones cosméticas, no bloqueantes:** varios de los campos renombrados o agregados
(`repayment_status`/`DebtStatus` en `Debt`, `progress_status` en `SavingsGoal`, `payment_status` en
`TaxObligation`, `base_currency` en `UserPreferences`) quedaron con la alineación de columnas
desincronizada respecto al resto del bloque — normal después de editar a mano. No es un error, solo
correlo antes de tu próxima migración:

```bash
pnpm --filter api exec prisma format
```

**Una sugerencia nueva, opcional, en la misma línea del hallazgo #7:** las tablas ledger que cuelgan
de otra entidad (`DebtPayment.debt_id`, `InvestmentTransaction.investment_id`,
`TaxPayment.tax_obligation_id`, `GoalContribution.goal_id`) tampoco tienen índice explícito en esa
FK, y sus consultas más comunes van a ser exactamente "dame el historial de esta deuda/inversión/
meta" — es decir, filtrando por esa columna. A diferencia del hallazgo #7, Postgres/Prisma no crea
ese índice automáticamente solo por ser una FK. Mismo criterio que ya usamos ahí: no urgente con un
solo usuario y pocas filas, pero es información que ya tenés a mano si querés adelantarlo ahora en
vez de en una migración aparte más adelante — vos decidís.

**Confirmé además que no quedó ningún campo de relación en camelCase** (revisé el archivo completo
con una búsqueda de patrón, no solo los que mencionaba el hallazgo #2 original) y que los 17 modelos
del hallazgo #7 tienen su `@@index([user_id])`. Con esto, el schema está listo para la migración —
avisame cuando la generes y con gusto reviso el resultado (`prisma migrate dev` genera el SQL, vale
la pena verlo antes de aplicarlo si es la primera vez que corrés esta migración específica).

## Lo que está bien — no tocar

- **Cero campos de dinero como `Float`** en las ~30 tablas del dominio financiero — todo es `Decimal`
  con precisión explícita, incluyendo casos no triviales: `interest_rate` en `Decimal(9,6)` (tasa
  porcentual, no monto), `InvestmentTransaction.quantity` en `Decimal(28,8)` (fracciones de cripto).
- **Patrón `transaction_id: String?` reutilizado de forma idéntica** en `GoalContribution`,
  `DebtPayment` y `TaxPayment` ("si el aporte/pago proviene de una Transaction real") — buena
  consistencia entre tres módulos distintos.
- **`currency_code` presente en todos los modelos que mueven dinero en una moneda específica.**
