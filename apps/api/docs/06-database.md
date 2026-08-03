# Database — Backend

## Setup

Schema: `src/database/prisma/schema.prisma`  
Migrations: `src/database/prisma/migrations/`  
Generated client: `src/database/prisma/generated-client/` (has `@ts-nocheck` — do not edit)

The schema uses a **non-default path**, so all Prisma commands include `--schema`:

```bash
pnpm prisma:migrate   # = prisma migrate dev --schema src/database/prisma/schema.prisma
pnpm prisma:generate  # = prisma generate --schema ...
pnpm prisma:reset     # drop DB + replay all migrations + seed
pnpm prisma:studio    # open Prisma Studio (localhost:5555)
pnpm prisma:seed      # run seed.ts only
```

---

## Schema Summary

### Core models

| Model | Table | Description |
|---|---|---|
| `User` | `users` | Core user record; holds 2FA fields, status, email verification |
| `UserProfile` | `user_profiles` | Extended profile (phone, address, avatar URL) |
| `UserPreferences` | `user_preferences` | Theme, language, timezone, notification settings |
| `RefreshToken` | `refresh_tokens` | Active refresh tokens (one per device/session) |
| `UserRecoveryCode` | `user_recovery_codes` | Bcrypt-hashed TOTP recovery codes |

### RBAC models

| Model | Table | Description |
|---|---|---|
| `Role` | `roles` | Named roles (admin, superadmin, client, …) |
| `Permission` | `permissions` | `(resource, action, scope)` tuples — unique composite |
| `RolePermission` | `role_permissions` | Role → Permission assignments |
| `UserRole` | `user_roles` | User → Role assignments (optional expiry) |
| `UserPermission` | `user_permissions` | Direct per-user permissions (bypass roles) |

### Audit

| Model | Table | Description |
|---|---|---|
| `ChangeLog` | `change_logs` | Audit log (structure exists; handlers don't write to it yet — pending feature) |

---

## Enums

```prisma
enum Status {
  ACTIVE | INACTIVE | SUSPENDED | PENDING | DELETED
}

enum PermissionScope {
  ALL   # applies to all records (default)
  OWN   # restricted to user's own records
  TEAM  # restricted to user's team/group
  ORG   # restricted to user's organization
}
```

---

## PrismaService

`PrismaService` extends `PrismaClient` and is provided by `DatabaseModule` which is `@Global()`. Inject it anywhere:

```typescript
constructor(private readonly prisma: PrismaService) {}
```

**New fields before `prisma generate`**: the generated client won't have types for new schema fields until `pnpm prisma:generate` runs. Workaround:

```typescript
// Temporary — remove the cast after running prisma:generate
await (this.prisma as any).user.update({ where: { id }, data: { new_field: value } })
```

---

## Migrations Workflow

```bash
# 1. Edit schema.prisma
# 2. Create and apply migration
pnpm prisma:migrate
# 3. Regenerate TypeScript client
pnpm prisma:generate
```

After `prisma:migrate`, commit both the schema and the migration file in `src/database/prisma/migrations/`.

---

## Seeding

Seed file: `src/database/prisma/seed.ts`

What the seed creates:
- Superadmin user (email + password from `ROOT_ADMIN_EMAIL` / `ROOT_ADMIN_PASSWORD` env vars)
- System roles: `superadmin`, `admin`, `client`
- System permissions covering all RBAC resources
- Role-permission assignments

Rerun seed without resetting the DB:

```bash
pnpm prisma:seed
```

The seed is idempotent — it uses `upsert` so running it twice is safe.

---

## Soft Deletes

`deleted_at DateTime?` is present on most models. The application sets `deleted_at` and flips `status` to `DELETED` rather than issuing a SQL `DELETE`. Cascade deletes are used only for join tables (e.g. `UserRole` cascades when the `User` is deleted).
