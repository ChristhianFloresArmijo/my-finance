# Módulo: Categorías y Etiquetas

`categorization` · Fase 1 (MVP)

## Objetivo

Clasificar transacciones de dos maneras complementarias: **categorías** (jerárquicas,
mutuamente excluyentes por transacción — una transacción tiene una sola categoría) y
**etiquetas** (libres, muchas por transacción — ej. "Vacaciones", "Universidad", "Impuestos").

## Entidades

```prisma
enum CategoryKind {
  INCOME
  EXPENSE
}

model Category {
  id        String       @id @default(uuid())
  user_id   String?      // null = categoría del sistema (seed), no editable/borrable por el usuario
  parent_id String?      // solo un nivel de anidación: categoría → subcategoría
  name      String
  kind      CategoryKind
  icon      String?
  color     String?
  is_system Boolean      @default(false)

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?
  status     Status    @default(ACTIVE)

  parent   Category?  @relation("CategoryTree", fields: [parent_id], references: [id])
  children Category[] @relation("CategoryTree")

  @@map("categories")
}

model Tag {
  id      String @id @default(uuid())
  user_id String
  name    String
  color   String?

  created_at DateTime  @default(now())
  updated_at DateTime? @updatedAt
  deleted_at DateTime?
  status     Status    @default(ACTIVE)

  transaction_tags TransactionTag[]

  @@unique([user_id, name])
  @@map("tags")
}

model TransactionTag {
  transaction_id String
  tag_id         String

  transaction Transaction @relation(fields: [transaction_id], references: [id], onDelete: Cascade)
  tag         Tag         @relation(fields: [tag_id], references: [id], onDelete: Cascade)

  @@id([transaction_id, tag_id])
  @@map("transaction_tags")
}
```

## Reglas de negocio

**Categorías del sistema vs. personalizadas.** `user_id = null` marca categorías sembradas por
defecto (Alimentación, Transporte, Vivienda, Salud, Educación, Tecnología, Entretenimiento,
Mascotas, Salario, Freelance, Dividendos, Intereses, Bonificaciones — la lista del borrador
original) visibles para todos los usuarios, no editables ni borrables. Las categorías con
`user_id` propio son "completamente personalizables", como pide el requisito original.

**Un solo nivel de subcategoría.** `parent_id` solo puede apuntar a una categoría que a su vez no
tenga `parent_id` (validado en el entity factory) — evita árboles de profundidad arbitraria que
complicarían el cálculo de presupuestos y reportes sin beneficio claro.

**Consistencia de `kind`.** Una subcategoría hereda el `kind` de su categoría padre; no se permite
una subcategoría `EXPENSE` bajo un padre `INCOME` (validado en el entity factory, no solo en el
frontend).

**Borrado con historial.** Borrar una categoría con transacciones existentes es un borrado lógico —
las transacciones históricas conservan la referencia. La UI debe ofrecer "reasignar transacciones a
otra categoría" como parte del flujo de borrado, no dejarlas apuntando a una categoría eliminada sin
alternativa.

**Etiquetas son siempre del usuario** (no hay etiquetas de sistema) y únicas por nombre por usuario
(`@@unique([user_id, name])`).

## Casos de uso (`capabilities/`)

| Caso de uso | Tipo |
|---|---|
| `create-category` | Command |
| `update-category` | Command |
| `delete-category` | Command (con opción de reasignar transacciones) |
| `list-categories` | Query (árbol completo, sistema + propias) |
| `create-tag` | Command |
| `update-tag` | Command |
| `delete-tag` | Command |
| `list-tags` | Query |
| `attach-tag-to-transaction` / `detach-tag-from-transaction` | Command |

## Endpoints sugeridos

| Método | Ruta | Descripción |
|---|---|---|
| GET | `/api/finance/categories` | Árbol de categorías (sistema + propias) |
| POST | `/api/finance/categories` | Crear categoría/subcategoría |
| PATCH | `/api/finance/categories/:id` | Actualizar |
| DELETE | `/api/finance/categories/:id` | Borrar (con `reassign_to` opcional) |
| GET | `/api/finance/tags` | Lista de etiquetas |
| POST | `/api/finance/tags` | Crear etiqueta |
| DELETE | `/api/finance/tags/:id` | Borrar etiqueta |

## Frontend

`CategoriesManagerView` (árbol con drag&drop opcional para reordenar), `TagsManagerView` (lista
simple con color). Composables `useCategories`, `useTags`.

## Relaciones con otros módulos

Usadas por [Transacciones](./02-transacciones.md) y [Presupuestos](./04-presupuestos.md) como
criterio de clasificación/alcance. Insumo de [Reportes y estadísticas](./11-reportes-y-estadisticas.md)
("gastos por categoría", "categoría con mayor gasto"). Objetivo de las reglas de
[Automatizaciones](./13-automatizaciones-e-ia.md) (ej. "si comercio = Walmart, categoría =
Alimentación").

## Decisiones abiertas

Ninguna crítica pendiente; el diseño de un solo nivel de subcategoría se puede revisar si en la
práctica se necesita más profundidad, pero se recomienda no anticiparlo.
