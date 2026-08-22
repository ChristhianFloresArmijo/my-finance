# Módulo: Suscripciones y Facturación

`billing` (módulo de plataforma, **no** es parte del dominio financiero) · Pista de monetización — ver
[05 — Estado actual y roadmap](../05-estado-actual-y-roadmap.md#pista-paralela-monetización-suscripciones-y-facturación)

## Objetivo

Cobrar una suscripción a los usuarios de la aplicación. Esto aplica **aunque no exista ningún
concepto de "hogar" u organización compartida** — cada usuario individual paga por su propio acceso,
igual que hoy cada usuario es dueño exclusivo de sus propios datos financieros. No es multi-tenant
en el sentido de compartir datos entre personas; es simplemente "cobrar por usar el producto".

## Por qué es un módulo de plataforma, no del dominio financiero

Igual que `account` (perfil de usuario) es distinto de `financial_accounts` (cuentas bancarias del
usuario), `billing` (lo que el usuario paga para usar la app) es conceptualmente distinto de
cualquier dato financiero *del propio usuario*. Vive junto a `account`, `authentication` y
`authorization` en `apps/api/src/modules/billing/` y `apps/web/src/modules/billing/`, con la misma
estructura DDD que el resto del proyecto.

## Entidades

```prisma
enum BillingInterval {
  MONTHLY
  YEARLY
}

model Plan {
  id               String          @id @default(uuid())
  code             String          @unique   // ej. "FREE", "BASIC", "PREMIUM"
  name             String
  price_amount     Decimal         @db.Decimal(18, 4)
  currency_code    String          @db.Char(3)
  billing_interval BillingInterval
  features         Json            // flags de feature-gating, ej. { "investments": true, "taxes": true }
  is_active        Boolean         @default(true)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt

  subscriptions Subscription[]

  @@map("plans")
}

enum SubscriptionStatus {
  TRIALING
  ACTIVE
  PAST_DUE
  CANCELED
  EXPIRED
}

enum PaymentProvider {
  STRIPE
}

model Subscription {
  id                       String              @id @default(uuid())
  user_id                  String              @unique   // un usuario = una suscripción (por ahora)
  plan_id                  String
  subscription_status      SubscriptionStatus  @default(TRIALING)
  provider                 PaymentProvider      @default(STRIPE)
  external_customer_id     String              // ID del cliente en el proveedor de pago
  external_subscription_id String?             // ID de la suscripción en el proveedor de pago
  current_period_start     DateTime?
  current_period_end       DateTime?
  cancel_at_period_end     Boolean             @default(false)
  trial_ends_at            DateTime?

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt

  user     User      @relation(fields: [user_id], references: [id], onDelete: Cascade)
  plan     Plan      @relation(fields: [plan_id], references: [id])
  invoices Invoice[]

  @@map("subscriptions")
}

enum InvoiceStatus {
  PAID
  FAILED
  PENDING
}

model Invoice {
  id                  String        @id @default(uuid())
  subscription_id     String
  external_invoice_id String        @unique
  amount              Decimal       @db.Decimal(18, 4)
  currency_code       String        @db.Char(3)
  invoice_status      InvoiceStatus
  paid_at             DateTime?

  created_at DateTime @default(now())

  subscription Subscription @relation(fields: [subscription_id], references: [id], onDelete: Cascade)

  @@map("invoices")
}

model BillingWebhookEvent {
  id           String   @id @default(uuid())
  provider     PaymentProvider
  external_id  String   // ID del evento en el proveedor — usado para idempotencia
  event_type   String
  processed_at DateTime?
  payload      Json

  created_at DateTime @default(now())

  @@unique([provider, external_id])
  @@map("billing_webhook_events")
}
```

## Reglas de negocio

**Nunca se guarda información de tarjeta.** Todo el manejo de pago vive en el proveedor
(recomendado: **Stripe**, vía Stripe Checkout + Stripe Billing) — la aplicación solo guarda
identificadores externos (`external_customer_id`, `external_subscription_id`,
`external_invoice_id`). Esto evita cualquier obligación de cumplimiento PCI directa.

**Los webhooks son la fuente de verdad del estado de la suscripción**, no el frontend ni una
llamada directa después del checkout. `BillingWebhookEvent` registra cada evento recibido con su
`external_id` como clave de idempotencia — los proveedores de pago reenvían eventos, y procesar el
mismo evento dos veces (ej. activar la suscripción dos veces) debe ser imposible por diseño, no por
suerte.

**Ciclo de vida de una suscripción:**
- `TRIALING` — periodo de prueba, acceso completo o limitado según se decida (ver plan).
- `ACTIVE` — pago al día.
- `PAST_DUE` — el cobro falló; se mantiene un periodo de gracia (definido por la política de
  reintentos de Stripe) antes de degradar el acceso — no se corta de inmediato.
- `CANCELED` — el usuario canceló; si `cancel_at_period_end = true`, conserva acceso hasta
  `current_period_end`, no se le corta el acceso el mismo día que cancela.
- `EXPIRED` — terminó el periodo pagado sin renovación ni período de gracia.

**Feature-gating por plan**, no por rol. `Plan.features` (JSON) define qué módulos financieros
están disponibles (ej. inversiones e impuestos solo en plan premium) — se valida con un guard
propio (`SubscriptionGuard` / `RequirePlanFeature('investments')`), independiente del `RolesGuard`/
`PermissionsGuard` de autorización ya existentes. Son dos preguntas distintas: "¿qué puedes hacer?"
(RBAC) vs. "¿por cuál plan estás pagando?" (billing).

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `list-plans` | Query |
| `create-checkout-session` | Command (devuelve URL de Stripe Checkout) |
| `handle-billing-webhook` | Command (procesa eventos con idempotencia) |
| `get-current-subscription` | Query |
| `cancel-subscription` | Command (`cancel_at_period_end = true`, no corte inmediato) |
| `list-invoices` | Query |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/billing/plans` | Planes disponibles |
| POST | `/api/billing/checkout-session` | Iniciar checkout de Stripe |
| POST | `/api/billing/webhook` | Receptor de webhooks (público, verificado por firma) |
| GET | `/api/billing/subscription` | Suscripción actual del usuario |
| POST | `/api/billing/subscription/cancel` | Cancelar (al final del periodo) |
| GET | `/api/billing/invoices` | Historial de facturas |

## Frontend

`PlansView` (página de precios), `BillingSettingsView` (plan actual, historial de facturas,
cancelar/cambiar de plan), componente `UpgradePrompt`/paywall reutilizable para bloquear
funciones de un plan superior dentro de las vistas de los módulos financieros. Composable `useBilling`.

## Relaciones con otros módulos

Controla el acceso a los módulos financieros mediante feature-gating por plan. Es independiente
del RBAC de [autorización](../03-arquitectura.md) — un usuario puede tener rol `client` (RBAC) y
plan `FREE` (billing) al mismo tiempo; son dos sistemas de control de acceso distintos y
complementarios.

## Decisiones abiertas

**Proveedor de pago.** Se recomienda Stripe por su soporte maduro en Node/NestJS y porque puede
resolver automáticamente el impuesto sobre la venta del servicio mismo (Stripe Tax) — relevante si
llegas a cobrar a usuarios en distintos países. Confirmar disponibilidad de Stripe en la región antes
de comprometerse (algunos países tienen soporte limitado como cuenta de cobro).

**Estructura de planes real** (cuántos niveles, qué incluye cada uno, precio) es una decisión de
negocio del usuario, no técnica — el modelo de datos (`Plan.features` como JSON) ya soporta
cualquier combinación sin migrar el esquema cada vez que cambie el pricing.

**Impuesto sobre la suscripción vs. módulo de Impuestos del dominio financiero.** Son conceptos
distintos: el [módulo de Impuestos](./10-impuestos.md) rastrea las obligaciones fiscales
*personales* del usuario que usa la app; el IVA/sales tax que se cobra *sobre el precio de la
suscripción misma* es un problema de negocio de Kishan como proveedor del servicio, típicamente
resuelto por el propio proveedor de pago (Stripe Tax) — no se mezclan en el mismo modelo de datos.

**Relación con un futuro `Household`.** `Subscription.user_id` es único (un usuario = una
suscripción) porque hoy no existe el concepto de hogar compartido (ver
[04 — Modelo de dominio y convenciones](../04-modelo-de-dominio-y-convenciones.md)). Si en el futuro
se construye ese concepto, la suscripción probablemente debería asociarse al hogar en vez de a un
usuario individual — no se resuelve ahora, solo se deja anotado para no diseñar algo que choque con
eso después.
