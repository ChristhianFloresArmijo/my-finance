# Módulo: Notificaciones, Recordatorios y Documentos

`reminders` + `documents` · Fase 2 (recordatorios/notificaciones) y Fase 3 (documentos)

## Objetivo

Avisar al usuario de cosas que requieren su atención (pagar tarjetas, pagar préstamos, ahorrar,
invertir, pagar impuestos) por correo, push o dentro de la aplicación; y permitir adjuntar
documentos (facturas, garantías, contratos, estados de cuenta, comprobantes) a los registros
financieros relevantes.

## Entidades: Recordatorios y Notificaciones

```prisma
enum ReminderSourceModule {
  DEBT
  TAX
  RECURRING_PAYMENT
  GOAL
  CUSTOM
}

model Reminder {
  id            String               @id @default(uuid())
  user_id       String
  title         String
  message       String?
  due_date      DateTime
  source_module ReminderSourceModule
  source_id     String?              // id de la entidad relacionada, si no es CUSTOM
  is_dismissed  Boolean              @default(false)

  created_at DateTime @default(now())

  @@map("reminders")
}

enum NotificationChannel {
  EMAIL
  PUSH
  IN_APP
}

model Notification {
  id                 String              @id @default(uuid())
  user_id            String
  channel            NotificationChannel
  title              String
  body               String
  related_reminder_id String?
  sent_at            DateTime?
  read_at            DateTime?

  created_at DateTime @default(now())

  reminder Reminder? @relation(fields: [related_reminder_id], references: [id])

  @@map("notifications")
}
```

### Reglas de negocio

**La mayoría de recordatorios se crean automáticamente**, no a mano: el job diario que ya revisa
vencimientos de [Deudas](./06-deudas.md), [Impuestos](./10-impuestos.md) y
[Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md) crea un `Reminder` con
`source_module`/`source_id` apuntando al origen. El usuario también puede crear recordatorios
`CUSTOM` libres (el "16. Recordatorios" del borrador: pagar tarjetas, pagar préstamos, ahorrar,
invertir, pagar impuestos — como lista libre si no quiere depender de que cada módulo lo genere
automáticamente).

**El canal de entrega respeta las preferencias ya existentes** en `UserPreferences`
(`notify_email`, `notify_push`) más las notificaciones `IN_APP`, que simplemente se listan en la
aplicación sin necesidad de "envío" activo.

## Entidad: Documentos

```prisma
enum DocumentEntityType {
  TRANSACTION
  DEBT
  ASSET
  TAX_OBLIGATION
}

model Document {
  id             String   @id @default(uuid())
  user_id        String
  file_reference String   // clave de almacenamiento — reutiliza IStorageProvider ya existente
  file_name      String
  mime_type      String

  created_at DateTime  @default(now())
  deleted_at DateTime?

  attachments DocumentAttachment[]

  @@map("documents")
}

model DocumentAttachment {
  id          String             @id @default(uuid())
  document_id String
  entity_type DocumentEntityType
  entity_id   String

  document Document @relation(fields: [document_id], references: [id], onDelete: Cascade)

  @@map("document_attachments")
}
```

### Nota de diseño: la única excepción deliberada a "siempre FKs explícitas"

El resto del esquema financiero usa columnas FK explícitas y nunca claves polimórficas (ver
[04 — Modelo de dominio y convenciones](../04-modelo-de-dominio-y-convenciones.md)). Los documentos
son la excepción: pueden adjuntarse a varios tipos de entidad distintos (transacción, deuda, activo,
obligación fiscal), y crear una tabla de unión (`document_transactions`, `document_debts`, …) por
cada tipo sería complejidad real para un requisito que en esencia es "adjuntar un archivo a un
registro". `DocumentAttachment.entity_id` **no tiene FK a nivel de base de datos** (no puede
apuntar a tablas distintas con una sola columna) — la integridad se valida en el `handler`
(confirmar que la entidad exista y pertenezca al usuario autenticado antes de crear el attachment).
Documentado explícitamente para que no se repita este patrón en ningún otro módulo sin la misma
justificación.

El almacenamiento físico del archivo reutiliza `IStorageProvider` (ya implementado con soporte local
y S3) — no se construye un mecanismo de storage nuevo.

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-reminder` | Command |
| `dismiss-reminder` | Command |
| `list-active-reminders` | Query |
| `generate-reminders-from-due-dates` | Scheduler (`@Cron`, diario) |
| `send-notification` | Command (interno, despacha según canal + preferencia) |
| `list-notifications` | Query |
| `mark-notification-read` | Command |
| `upload-document` | Command |
| `attach-document-to-entity` | Command (valida existencia + pertenencia de la entidad) |
| `list-documents-for-entity` | Query |
| `delete-document` | Command |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/reminders` | Recordatorios activos |
| POST | `/api/finance/reminders` | Crear recordatorio personalizado |
| POST | `/api/finance/reminders/:id/dismiss` | Descartar |
| GET | `/api/finance/notifications` | Lista de notificaciones |
| PATCH | `/api/finance/notifications/:id/read` | Marcar leída |
| POST | `/api/finance/documents` | Subir documento |
| POST | `/api/finance/documents/:id/attach` | Adjuntar a una entidad |
| GET | `/api/finance/documents?entity_type=&entity_id=` | Documentos de una entidad |

## Frontend

Campana de notificaciones (`NotificationBell`) en el layout principal, `RemindersListView`,
componente reutilizable `DocumentUploadField` (usado dentro de los formularios de Transacción,
Deuda, Activo, Impuesto). Composables `useReminders`, `useNotifications`, `useDocuments`.

## Relaciones con otros módulos

Generado por [Deudas](./06-deudas.md), [Impuestos](./10-impuestos.md) y
[Pagos recurrentes](./09-pagos-recurrentes-y-calendario.md). Aparece también en el
[Calendario financiero](./09-pagos-recurrentes-y-calendario.md#el-calendario-financiero-no-es-una-tabla-propia).
Los documentos se adjuntan a [Transacciones](./02-transacciones.md), [Deudas](./06-deudas.md),
[Activos](./08-activos-y-patrimonio.md) e [Impuestos](./10-impuestos.md).

## Decisiones abiertas

Ninguna crítica adicional a la ya documentada sobre `DocumentAttachment`.
