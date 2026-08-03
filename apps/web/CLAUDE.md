# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Overview

This is a **monorepo of two paired projects**:

| Project | Path | Stack |
|---|---|---|
| Frontend | `vue-ddd-template/` | Vue 3 · TypeScript · Tailwind v4 · Pinia · Vite |
| Backend | `nestjs-prisma-ddd-template/` | NestJS · Prisma · PostgreSQL · CQRS · JWT |

Both follow Domain-Driven Design (DDD) with the same three-layer structure: `business` → `capabilities` → `integration/presentation`.

---

## Commands

### Frontend (`vue-ddd-template/`)

```bash
pnpm dev            # Vite dev server (port 5173)
pnpm build          # Type-check + production build
pnpm type-check     # vue-tsc --noEmit only
pnpm lint           # ESLint --fix
pnpm test           # Vitest (watch)
pnpm test:unit      # Vitest (single run)
pnpm test:coverage  # Vitest with v8 coverage
```

Frontend config: `src/config/app.config.ts` — reads `VITE_API_BASE_URL`, `VITE_BACKEND_TYPE`, `VITE_APP_NAME` from `.env`.

### Backend (`nestjs-prisma-ddd-template/`)

```bash
pnpm dev                  # Install + start with --watch (hot reload)
pnpm start:prod           # node dist/main
pnpm build                # nest build
pnpm lint                 # ESLint --fix
pnpm test                 # Jest (all *.spec.ts)
pnpm test:watch           # Jest watch mode
pnpm test:e2e             # Jest with jest-e2e.json config

# Prisma — always pass --schema flag (non-default location)
pnpm prisma:generate      # Regenerate client after schema changes
pnpm prisma:migrate       # prisma migrate dev (creates + applies migration)
pnpm prisma:reset         # Drop DB + replay all migrations + seed
pnpm prisma:studio        # Open Prisma Studio
pnpm prisma:seed          # Run seed.ts directly
```

Schema location: `src/database/prisma/schema.prisma`
Generated client: `src/database/prisma/generated-client/` (has `@ts-nocheck` — do not edit)

### Docker (backend)

```bash
docker compose up -d          # Starts: app (3000), postgres (5432), adminer (8080), mailhog (1025/8025)
docker compose up db mailhog  # Just infrastructure, run NestJS locally
```

Copy `.env.example` → `.env` before first run.

---

## Backend Architecture (`nestjs-prisma-ddd-template/`)

### Module layout

```
src/modules/
  account/          # User CRUD, profile, preferences, password, avatar
  authentication/   # JWT, sign-in/up/out, refresh, 2FA/TOTP, sessions
  authorization/    # RBAC — roles, permissions, user-role assignments
  meta/             # GET /meta/enums — i18n-ready enum labels
  shared/           # PrismaService, RepositoryService, MailService, error utils
```

### DDD layers (identical in every module)

```
business/
  entities/         # Domain entities with factory method Entity.instance(data)
  repositories/     # Abstract interfaces (IUserRepository, IRoleRepository, …)
  services/         # Domain services (AuthorizationService)
capabilities/
  <action-name>/
    command.ts      # or query.ts — plain data class
    handler.ts      # @CommandHandler / @QueryHandler — all business logic lives here
    index.ts        # re-exports
  commands.ts       # barrel: export { XCommand } from './x'
  queries.ts        # barrel
  handlers.ts       # default export array — registered in module providers
  guards/           # JwtAuthGuard, RolesGuard, PermissionsGuard
integration/
  repositories/     # Concrete Prisma implementations of the abstract interfaces
  strategies/       # Passport strategies (JWT, JwtRefresh, Local)
  services/         # TotpService, PrismaService
presentation/
  restful/          # NestJS controllers (dispatch commands/queries only)
  dtos/             # class-validator DTOs (ValidationPipe is global + forbidNonWhitelisted)
  decorators/       # @CurrentUser(), @Public(), @RequireRole()
  schedulers/       # @Cron jobs
```

### Critical patterns

**CQRS bus is singleton** — handlers from all modules register to the same bus. A controller in `AccountModule` can dispatch a command whose handler lives in `AuthenticationModule` (e.g. `AdminDisable2faCommand`).

**`forbidNonWhitelisted: true` is global** — any field not declared with a class-validator decorator in the DTO causes a 400. Always add `@IsOptional()` decorators for optional fields.

**`PrismaService` is `@Global()`** via `DatabaseModule` — inject it directly anywhere without importing `DatabaseModule`.

**New Prisma fields before `prisma generate`** — the generated client won't have types for new schema fields until `pnpm prisma:generate` is run. Use `(this.prisma as any).model.method(...)` as a temporary workaround, then remove the cast after regeneration.

**`forwardRef()`** is required for circular module dependencies: `AccountModule` ↔ `AuthenticationModule` ↔ `AuthorizationModule`.

**Error handling** — handlers return `Result<T, HandlerError>`:
```ts
return success(value)   // { isOk: true, value }
return failure(error)   // { isOk: false, error }
```
Controllers check `result.isOk` and `throw result.error` — never catch in controllers.

**Route guards** — write endpoints require `@UseGuards(JwtAuthGuard, RolesGuard) @RequireRole('superadmin')`. Read endpoints typically only need `@UseGuards(JwtAuthGuard)`.

### Path aliases (tsconfig)

```
@account/*    → src/modules/account/*
@auth/*       → src/modules/authentication/*
@authorization/* → src/modules/authorization/*
@shared/*     → src/modules/shared/*
@database/*   → src/database/*
@config/*     → src/config/*
```

### Key endpoints

| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/sign-in` | Returns cookies or `{ requires_2fa, totp_pending_token }` |
| POST | `/api/auth/2fa/verify-login` | Complete sign-in when 2FA is required |
| POST | `/api/auth/2fa/setup` | Generate TOTP secret + `otpauth://` URI |
| POST | `/api/auth/2fa/enable` | Verify code, enable 2FA, return recovery codes |
| POST | `/api/auth/2fa/disable` | Disable 2FA (requires TOTP code or recovery code) |
| GET  | `/api/auth/2fa/status` | Current user's 2FA status |
| GET  | `/api/meta/enums` | `{ status, permissionScope }` as `{ value, label }[]` |
| GET  | `/api/admin/stats` | Dashboard counts |
| GET  | `/api/account/:id/sessions` | User sessions (superadmin) |
| GET  | `/api/account/:id/2fa-status` | User 2FA status (superadmin) |
| DELETE | `/api/account/:id/2fa` | Force-disable 2FA (superadmin) |

Swagger / API reference: `http://localhost:3000/reference`

---

## Frontend Architecture (`vue-ddd-template/`)

### Module layout

```
src/modules/
  authentication/   # sign-in/up/out, 2FA flow, JWT session store
  account/          # profile, preferences
  authorization/    # RBAC store, role/permission checks, v-can directive
  admin/            # Superadmin panel (users, roles, permissions, dashboard)
  home/             # Public-facing pages
  demo/             # Form + authorization demos
src/shared/
  business/         # Entity, ValueObject, Result<T, E>
  integration/      # AxiosHttpClient, AdaptedHttpClient, BackendAdapter
  presentation/     # UI components (Ark UI), composables, form utilities
```

### DDD layers (per module)

```
business/
  entities/         # Domain entities
  repositories/     # Interfaces (IUserRepository, IAuthorizationRepository, …)
  schemas/          # Zod validation schemas
capabilities/       # Use-case classes (SignInUseCase, CheckPermissionUseCase, …)
integration/
  repositories/     # Axios implementations of the interfaces
  stores/           # Pinia stores (authStore, authorizationStore)
presentation/
  composables/      # useAuth, useAccount, useAdminUsers, useAdminMeta, …
  views/            # Vue SFC pages
  components/       # Shared components
```

### HTTP layer

All HTTP calls go through `AdaptedHttpClient(axiosClient, adapter)`. The adapter (`NestJSAdapter` or `DjangoAdapter`) handles request/response transformation and error normalisation. Set `VITE_BACKEND_TYPE=nestjs` (default).

### Auth & authorization flow

1. `useAuth().signIn()` → `SignInUseCase` → `UserRepository.signIn()` → POST `/auth/sign-in`
2. If response has `requires_2fa: true` → caller shows TOTP step → `useAuth().signIn2fa(pendingToken, code)`
3. On success, cookies are set by the server; `checkAuth()` fetches `/auth/me` and populates `authStore` + `authorizationStore`
4. Route guard in `router/index.ts` reads `authStore.isAuthenticated` and `authorizationStore.hasAnyRole([...])`

**`authorizationStore`** holds roles + permissions for the current user. Use `hasAnyRole(['admin', 'superadmin'])` and `hasPermission('resource:action')` anywhere in the app.

**`v-can` directive** — template-level permission checks (registered in `authorization/presentation/directives`).

### Admin panel composables

All admin data fetching goes through dedicated composables, never direct `axios` calls from views:

| Composable | Responsibility |
|---|---|
| `useAdminUsers` | User CRUD, status, sessions, 2FA admin actions |
| `useAdminRoles` | Role CRUD, permission assignment |
| `useAdminPermissions` | Permission CRUD |
| `useAdminMeta` | Enum labels (`/meta/enums`) with module-level cache; dashboard stats |

### Tailwind v4 rules

- Use `@custom-variant dark` (not `darkMode: 'class'` in config)
- Never use `@apply` inside `<style scoped>`
- Use inline utility classes only

### Drawer pattern

Side drawers use `<Teleport to="body">` + `<Transition name="slide">`. The `UsersListView.vue` drawer is the canonical example — tabs for overview / edit / security / roles / permissions / sessions.

### Path aliases (vite/tsconfig)

```
@/*  → src/*
```

---

## 2FA Implementation Notes

The TOTP implementation uses **pure Node.js `crypto`** (no external packages) — RFC 6238 with HMAC-SHA1, 30-second windows, ±1 window clock skew, base32 encode/decode inline.

**Sign-in flow with 2FA:**
1. POST `/auth/sign-in` → if `totp_enabled`, server returns `{ requires_2fa: true, totp_pending_token }` (no cookies, no full tokens)
2. The pending token is signed with `JWT_SECRET_KEY + ":totp_pending"` so `JwtAuthGuard` rejects it
3. POST `/auth/2fa/verify-login` with `{ pending_token, code }` → verifies code or recovery code → issues cookies

**Recovery codes:** 8 × 10-char hex codes, bcrypt-hashed in `user_recovery_codes` table. Using a recovery code marks it `used_at` (not deleted), so the audit trail is preserved.

---

## Database

Schema: `src/database/prisma/schema.prisma`
Migrations: `src/database/prisma/migrations/`

After any schema change:
```bash
pnpm prisma:migrate   # creates migration file + applies it
pnpm prisma:generate  # regenerates the TypeScript client
```

The `ChangeLog` model exists for audit logging but handlers do not yet write to it automatically — this is a pending feature.
