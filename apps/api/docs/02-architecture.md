# Architecture — Backend

## Module Layout

```
src/modules/
  account/          # User CRUD, profile, preferences, password, avatar
  authentication/   # JWT, sign-in/up/out, refresh, 2FA/TOTP, sessions
  authorization/    # RBAC — roles, permissions, user-role assignments
  meta/             # GET /meta/enums — i18n-ready enum labels
  shared/           # PrismaService, RepositoryService, MailService, error utils
```

---

## DDD Layers (same structure in every module)

```
business/
  entities/         # Domain entities with factory method
  repositories/     # Abstract interfaces (IUserRepository, IRoleRepository, …)
  services/         # Domain services (AuthorizationService)

capabilities/
  <action-name>/
    command.ts      # or query.ts — plain data class
    handler.ts      # @CommandHandler / @QueryHandler — all business logic lives here
    index.ts        # re-exports
  commands.ts       # barrel export
  queries.ts        # barrel export
  handlers.ts       # default export array — registered in module providers
  guards/           # JwtAuthGuard, RolesGuard, PermissionsGuard

integration/
  repositories/     # Concrete Prisma implementations of abstract interfaces
  strategies/       # Passport strategies (JWT, JwtRefresh, Local)
  services/         # TotpService, PrismaService

presentation/
  restful/          # NestJS controllers (dispatch commands/queries only)
  dtos/             # class-validator DTOs
  decorators/       # @CurrentUser(), @Public(), @RequireRole()
  schedulers/       # @Cron jobs
```

---

## Domain Entities

Every entity exposes a static `Entity.instance(data)` factory that validates input and returns a `Result<Entity, ErrorCollection>`:

```typescript
const result = User.instance({
  first_name: 'John',
  email: 'john@example.com',
  password: hashedPassword,
})

if (!result.isOk) throw new BadRequestException(result.error)
const user = result.value
```

Validation uses Valibot (`v.object(User.rules)`). The `validate()` method collects field errors AND cross-field errors (e.g. password confirmation) into a single `ErrorCollection` before returning.

---

## Result Type

Handlers return `Result<T, HandlerError>`:

```typescript
return success(value)   // { isOk: true, value }
return failure(error)   // { isOk: false, error }
```

Controllers check `result.isOk` and `throw result.error` — never catch in controllers.

---

## CQRS Pattern

```typescript
// Command: dispatch from controller, handle in handler
const result = await this.commandBus.execute(new CreateUserCommand(dto))

// Query: same pattern
const user = await this.queryBus.execute(new FindUserByIdQuery(id))
```

**The CQRS bus is a singleton across all modules.** A controller in `AccountModule` can dispatch a command whose handler lives in `AuthenticationModule` — no import needed, just execute the command class.

Handlers are registered in each module's `providers` array via the `handlers.ts` barrel:

```typescript
// authentication.module.ts
import handlers from './capabilities/handlers'

@Module({ providers: [...handlers] })
export class AuthenticationModule {}
```

---

## Global Providers and Patterns

**`PrismaService` is `@Global()`** via `DatabaseModule` — inject it anywhere without importing `DatabaseModule`.

**`forbidNonWhitelisted: true` is global** — any field not declared with a class-validator decorator in the DTO causes a 400. Always add `@IsOptional()` for optional fields.

**`forwardRef()`** is required for circular module dependencies:
```
AccountModule ↔ AuthenticationModule ↔ AuthorizationModule
```

---

## Adding a New Feature

1. **Command/Query** — create `capabilities/<action-name>/command.ts` (plain class)
2. **Handler** — create `capabilities/<action-name>/handler.ts` with `@CommandHandler(MyCommand)` or `@QueryHandler`
3. **Barrel** — add to `capabilities/commands.ts` (or `queries.ts`) and `capabilities/handlers.ts`
4. **Controller** — dispatch via `commandBus.execute(new MyCommand(dto))`
5. **DTO** — add to `presentation/dtos/` with class-validator decorators

For persistence:
- Add method to the abstract repository interface in `business/repositories/`
- Implement in `integration/repositories/`

---

## Path Aliases

```
@account/*        → src/modules/account/*
@auth/*           → src/modules/authentication/*
@authorization/*  → src/modules/authorization/*
@shared/*         → src/modules/shared/*
@database/*       → src/database/*
@config/*         → src/config/*
```
