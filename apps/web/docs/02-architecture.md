# Architecture — Frontend

## Module Layout

```
src/modules/
  authentication/   ← sign-in/up/out, 2FA flow, JWT session store
  account/          ← profile, preferences, session management
  authorization/    ← RBAC store, v-can directive, route guards
  admin/            ← superadmin panel (users, roles, permissions, dashboard)
  home/             ← public-facing pages
  demo/             ← form + authorization demos

src/shared/
  business/         ← Entity base, ValueObject, Result<T, E>
  integration/      ← AxiosHttpClient, AdaptedHttpClient, BackendAdapter
  presentation/     ← UI components (Ark UI), shared composables, form utilities
```

---

## DDD Layers (per module)

Each module follows the same four-layer structure:

```
business/
  entities/         ← domain entities with static instance() factory
  repositories/     ← abstract interfaces (IUserRepository, …)
  schemas/          ← Zod validation schemas

capabilities/       ← use-case classes (SignInUseCase, CheckPermissionUseCase, …)

integration/
  repositories/     ← Axios implementations of the abstract interfaces
  stores/           ← Pinia stores (authStore, authorizationStore)

presentation/
  composables/      ← useAuth, useTotp, useAdminUsers, …
  views/            ← Vue SFC pages
  components/       ← module-scoped UI components
```

The flow is always: **view → composable → use-case → repository → HTTP client**.  
Views never call repositories directly. Repositories never know about Vue or Pinia.

---

## Entity Factory Pattern

All domain entities are constructed via a static `instance()` method that validates input:

```typescript
const result = User.instance(data)
if (!result.isOk) {
  // result.error is a Record<field, string[]>
  throw new ValidationError(result.error)
}
const user = result.value
```

Entity constructors are private. This ensures no invalid entity can exist at runtime.

---

## Result Type

Use-cases return `Result<T, E>` — a discriminated union:

```typescript
// From @/shared/business
type Result<T, E> =
  | { isSuccess: true;  value: T }
  | { isSuccess: false; error: E }

Result.ok(value)    // success branch
Result.fail(error)  // failure branch
```

Composables check `result.isSuccess` and update reactive state accordingly — no try/catch at the view layer.

---

## Adding a New Module

1. Create `src/modules/my-module/` with the four subfolders
2. Define entities in `business/entities/` with `static instance()` factory
3. Define the repository interface in `business/repositories/`
4. Implement the repository in `integration/repositories/` using `AdaptedHttpClient`
5. Write use-cases in `capabilities/`
6. Write composables in `presentation/composables/` that inject `HTTP_CLIENT_KEY`
7. Add views to `presentation/views/` and register routes in `src/router/index.ts`

---

## Drawer Pattern

Side drawers use `<Teleport to="body">` + `<Transition name="slide">`:

```html
<Teleport to="body">
  <Transition name="slide">
    <div v-if="isOpen" class="fixed inset-0 ...">
      <!-- content -->
    </div>
  </Transition>
</Teleport>
```

`UsersListView.vue` is the canonical reference — tabs for overview, edit, security, roles, permissions, and sessions.
