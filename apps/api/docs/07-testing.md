# Testing — Backend

## Stack

- **Jest** — test runner
- **`@nestjs/testing`** — `Test.createTestingModule()` for handler unit tests
- No live DB for unit tests — all repository calls are mocked

---

## Commands

```bash
pnpm test           # run all *.spec.ts files once
pnpm test:watch     # watch mode
pnpm test:e2e       # e2e suite (requires live DB — uses jest-e2e.json config)
```

---

## File Locations

Unit tests live under `test/` mirroring the `src/` module layout:

```
test/
  account/
    capabilities/
      create-user.handler.spec.ts
      change-password.handler.spec.ts
  authentication/
    capabilities/
      sign-in.handler.spec.ts
      generate-token-pair.handler.spec.ts
```

---

## Handler Unit Test Pattern

Handlers receive repositories via NestJS DI. In tests, create a module with mock providers:

```typescript
import { Test, TestingModule } from '@nestjs/testing'
import { CommandBus, CqrsModule } from '@nestjs/cqrs'
import { ConfigService } from '@nestjs/config'
import { CreateUserHandler } from '@account/capabilities/create-user'
import { IUserRepository } from '@account/business/repositories'

describe('CreateUserHandler', () => {
  let handler: CreateUserHandler
  let userRepository: jest.Mocked<IUserRepository>

  beforeEach(async () => {
    const mockUserRepository: jest.Mocked<IUserRepository> = {
      findByEmail: jest.fn(),
      save: jest.fn(),
      // …all interface methods
    }

    const module: TestingModule = await Test.createTestingModule({
      imports: [CqrsModule],
      providers: [
        CreateUserHandler,
        { provide: IUserRepository, useValue: mockUserRepository },
        { provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(null) } },
      ],
    }).compile()

    handler = module.get(CreateUserHandler)
    userRepository = module.get(IUserRepository)
  })

  it('creates a user and returns success', async () => {
    userRepository.findByEmail.mockResolvedValueOnce(null) // no existing user
    userRepository.save.mockResolvedValueOnce({ id: 'u1', email: 'x@example.com' } as any)

    const result = await handler.execute(new CreateUserCommand({ email: 'x@example.com', /* … */ }))

    expect(result.isOk).toBe(true)
    expect(userRepository.save).toHaveBeenCalledOnce()
  })

  it('returns failure when email is already taken', async () => {
    userRepository.findByEmail.mockResolvedValueOnce({ id: 'u1' } as any)

    const result = await handler.execute(new CreateUserCommand({ email: 'x@example.com', /* … */ }))

    expect(result.isOk).toBe(false)
    expect(userRepository.save).not.toHaveBeenCalled()
  })
})
```

---

## Critical Patterns

### Use the class token for `ConfigService`

NestJS resolves providers by token. Use the `ConfigService` class, not a string:

```typescript
// ✅ correct
{ provide: ConfigService, useValue: { get: jest.fn().mockReturnValue(null) } }

// ❌ wrong — NestJS can't resolve 'ConfigService' (string token)
{ provide: 'ConfigService', useValue: { get: jest.fn() } }
```

### `Result` helpers

Handlers return `success(value)` or `failure(error)` from `@shared/business/utils/result`. Test both paths:

```typescript
expect(result.isOk).toBe(true)
expect(result.value).toEqual(expectedValue)

expect(result.isOk).toBe(false)
expect(result.error).toMatchObject({ field: 'error message' })
```

### `User.validate` collects all errors

The entity `validate()` method gathers field-level errors (from Valibot) AND cross-field errors (e.g. password confirmation) into a single `ErrorCollection`. Tests for password mismatch must pass a mismatched `repassword` — not rely on bypassing Valibot:

```typescript
it('returns failure when new password and confirm do not match', async () => {
  const result = await handler.execute(new ChangePasswordCommand({
    userId: 'u1',
    currentPassword: 'Correct1!',
    newPassword: 'NewPass1!',
    confirmPassword: 'Different1!',
  }))

  expect(result.isOk).toBe(false)
})
```

### Config key names

The `ConfigService` maps env vars to camelCase keys defined in `src/config/`. Use the camelCase key when asserting `.get()` calls:

| Env var | Config key |
|---|---|
| `JWT_SECRET_KEY` | `jwtSecretKey` |
| `JWT_REFRESH_SECRET_KEY` | `jwtRefreshSecretKey` |
| `ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC` | `secretKeyExpiresIn` |
| `REFRESH_TOKEN_VALIDITY_DURATION_IN_SEC` | `refreshTokenExpiresIn` |

---

## E2E Tests

E2E tests require a live PostgreSQL database. They use a separate Jest config (`jest-e2e.json`) that spins up the full NestJS app:

```bash
# start infrastructure first
docker compose up db -d

# then run e2e
pnpm test:e2e
```

E2E tests live in `test/` files named `*.e2e-spec.ts`.
