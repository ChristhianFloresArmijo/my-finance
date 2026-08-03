# Testing — Frontend

## Stack

- **Vitest 4** + **happy-dom** — test runner and DOM environment
- **Pinia** — store isolation via `setActivePinia(createPinia())`
- No `@vue/test-utils` needed — composables are tested directly without mounting components

---

## Commands

```bash
pnpm test:unit      # single run
pnpm test           # watch mode
pnpm test:coverage  # v8 coverage report
```

---

## File Location

Tests live alongside the composable they test:

```
src/modules/authentication/presentation/composables/
  useAuth.ts
  __tests__/
    useAuth.spec.ts
    useTotp.spec.ts
    useSessions.spec.ts

src/shared/presentation/composables/
  useErrorHandler.ts
  __tests__/
    useErrorHandler.spec.ts
```

---

## Mocking `UserRepository`

Composables call `new UserRepository(client)` internally. To mock it, replace the class in the module with a `vi.hoisted` + `vi.mock` combination.

### Why `vi.hoisted`?

`vi.mock` factories are hoisted above module-level `const` declarations. Variables like `const mockSignIn = vi.fn()` are in the temporal dead zone when the factory runs. `vi.hoisted` lifts them up so they're available inside the factory.

### Why a class, not `vi.fn()`?

In Vitest 4, `vi.fn().mockImplementation(() => ({...}))` inside a mock factory does not produce a constructor-compatible function. A plain `class` is guaranteed to work with `new`.

### Why `async (importOriginal)` + spread?

The module exports more than just `UserRepository` (e.g. `useAuthStore`). Spreading `...actual` preserves those exports — only `UserRepository` is overridden.

### Full pattern

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useAuth } from '../useAuth'
import { Result } from '@/shared/business'

// 1. Hoist mock functions before the vi.mock factory runs
const mocks = vi.hoisted(() => ({
  signIn: vi.fn(),
  getCurrentUser: vi.fn(),
  signOut: vi.fn(),
}))

// 2. Replace UserRepository with a class (must spread actual to keep other exports)
vi.mock('@/modules/authentication/integration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/modules/authentication/integration')>()
  return {
    ...actual,
    UserRepository: class MockUserRepository {
      signIn = mocks.signIn
      getCurrentUser = mocks.getCurrentUser
      signOut = mocks.signOut
    },
  }
})

// 3. Mock vue-router if the composable calls useRouter()
const mockPush = vi.hoisted(() => vi.fn())
vi.mock('vue-router', () => ({ useRouter: () => ({ push: mockPush }) }))

describe('useAuth', () => {
  beforeEach(() => {
    setActivePinia(createPinia())  // fresh Pinia for each test
    vi.clearAllMocks()             // reset call history (not implementations)
  })

  it('populates stores on successful sign-in', async () => {
    mocks.signIn.mockResolvedValueOnce(Result.ok(null))
    mocks.getCurrentUser.mockResolvedValueOnce(Result.ok({
      id: 'u1', email: 'test@x.com', roles: [], permissions: [],
      // ...other CurrentUserDto fields
    }))

    const { signIn, authStore } = useAuth()
    const result = await signIn({ email: 'test@x.com', password: 'pass' })

    expect(result.isSuccess).toBe(true)
    expect(authStore.isAuthenticated).toBe(true)
    expect(authStore.user?.email).toBe('test@x.com')
  })

  it('returns failure and leaves stores empty on bad credentials', async () => {
    mocks.signIn.mockResolvedValueOnce(Result.fail('Invalid credentials'))

    const { signIn, authStore } = useAuth()
    const result = await signIn({ email: 'bad@x.com', password: 'wrong' })

    expect(result.isSuccess).toBe(false)
    expect(authStore.isAuthenticated).toBe(false)
  })
})
```

---

## Testing Pure Composables (no repository)

`useErrorHandler` has no side effects or DI — test it directly:

```typescript
import { useErrorHandler } from '@/shared/presentation/composables/useErrorHandler'

it('normalises Error objects', () => {
  const { handleError, error } = useErrorHandler()
  handleError(new Error('oops'))
  expect(error.value).toBe('oops')
})

it('normalises null to a generic message', () => {
  const { handleError, error } = useErrorHandler()
  handleError(null)
  expect(error.value).toBe('An unknown error occurred')
})

it('withErrorHandling catches and sets error', async () => {
  const { withErrorHandling, error } = useErrorHandler()
  await withErrorHandling(() => Promise.reject(new Error('network error')))
  expect(error.value).toBe('network error')
})
```

---

## Vitest Config

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'happy-dom',
    globals: true,
    include: ['src/**/*.spec.ts', 'tests/**/*.spec.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts', 'src/**/*.vue'],
      exclude: ['src/main.ts', 'src/**/*.d.ts', 'src/router/**'],
    },
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

---

## Common Gotchas

**`inject()` warning in tests** — composables call `inject(HTTP_CLIENT_KEY)` outside a Vue setup context. Vitest prints a Vue warning but the test still works because `UserRepository` is mocked and the injected value is never actually used.

**`vi.clearAllMocks()` vs `vi.resetAllMocks()`** — `clearAllMocks` only resets call history (not implementations). Use it in `beforeEach`. `resetAllMocks` would wipe the class mock implementations too — avoid it here.

**Module-level `useAuthStore` access** — `authStore` returned from `useAuth()` is a Pinia store. It only works after `setActivePinia(createPinia())` is called in `beforeEach`.
