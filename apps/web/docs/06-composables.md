# Composables Reference

All composables follow the same pattern: inject `HTTP_CLIENT_KEY`, instantiate the repository, expose reactive state and action functions.

---

## `useAuth`

```typescript
import { useAuth } from '@/modules/authentication/presentation/composables/useAuth'

const { signIn, signIn2fa, signOut, checkAuth, isLoading, error, authStore } = useAuth()
```

| Name | Type | Description |
|---|---|---|
| `signIn(dto)` | `(dto) → Promise<Result>` | Sign in with email/password |
| `signIn2fa(token, code)` | `(string, string) → Promise<Result>` | Complete 2FA login |
| `signOut(redirectTo?)` | `(string\|null?) → Promise<void>` | Sign out and optionally redirect |
| `checkAuth()` | `() → Promise<boolean>` | Fetch current user and populate stores |
| `isLoading` | `Ref<boolean>` | True during any async operation |
| `error` | `Ref<string\|null>` | Last error message |
| `authStore` | `Store` | Direct access to the auth Pinia store |

---

## `useTotp`

```typescript
import { useTotp } from '@/modules/authentication/presentation/composables/useTotp'

const {
  fetchStatus, startSetup, enable, disable, regenerateCodes, clearRecoveryCodes,
  status, setupUri, recoveryCodes,
  statusLoading, setupLoading, enableLoading, disableLoading,
  statusError, setupError, enableError, disableError, regenError,
} = useTotp()
```

| Name | Type | Description |
|---|---|---|
| `fetchStatus()` | `() → Promise<void>` | Load current 2FA status |
| `startSetup()` | `() → Promise<void>` | Get TOTP secret and URI |
| `enable(code)` | `(string) → Promise<boolean>` | Enable 2FA, returns recovery codes |
| `disable(code)` | `(string) → Promise<boolean>` | Disable 2FA |
| `regenerateCodes(code)` | `(string) → Promise<boolean>` | Generate new recovery codes |
| `clearRecoveryCodes()` | `() → void` | Null out recovery codes after user saves them |
| `status` | `Ref<TotpStatusDto\|null>` | `{ totp_enabled, totp_enabled_at, recovery_codes_remaining }` |
| `setupUri` | `Ref<string\|null>` | `otpauth://totp/...` URI for QR code |
| `recoveryCodes` | `Ref<string[]\|null>` | Codes shown once after enable/regenerate |

---

## `useSessions`

```typescript
import { useSessions } from '@/modules/account/presentation/composables/useSessions'

const { loadSessions, revokeSession, revokeAllSessions, sessions, loading, revokeLoadingId, error, revokeError } = useSessions()
```

| Name | Type | Description |
|---|---|---|
| `loadSessions(userId?)` | `(string?) → Promise<void>` | Fetch sessions for a user |
| `revokeSession(id)` | `(string) → Promise<void>` | Revoke one session |
| `revokeAllSessions()` | `() → Promise<void>` | Revoke all sessions |
| `sessions` | `Ref<SessionDto[]>` | Loaded sessions |
| `revokeLoadingId` | `Ref<string\|null>` | ID of session currently being revoked |

---

## `useErrorHandler`

Utility composable for standardised error handling in any composable or view.

```typescript
import { useErrorHandler } from '@/shared/presentation/composables/useErrorHandler'

const { handleError, clearError, withErrorHandling, error } = useErrorHandler()
```

| Name | Description |
|---|---|
| `handleError(e)` | Normalises any value (Error, string, object, null) to `error.value` |
| `clearError()` | Sets `error.value = null` |
| `withErrorHandling(fn)` | Wraps an async function — catches and sets `error`, returns `undefined` on throw |
| `error` | `Ref<string\|null>` |

```typescript
// Normalisation examples
handleError(new Error('oops'))         // → 'oops'
handleError('plain string')            // → 'plain string'
handleError({ message: 'x' })         // → 'x'
handleError(null)                      // → 'An unknown error occurred'

// Wrap an async call
const user = await withErrorHandling(() => repo.getCurrentUser())
// if repo throws, error.value is set and user === undefined
```

---

## Admin Composables

All admin data fetching goes through dedicated composables — never direct axios calls from views.

### `useAdminUsers`

```typescript
const {
  users, loadUsers, createUser, updateUser, deleteUser,
  toggleStatus, adminDisable2fa,
  loadSessions, revokeSession, revokeAllSessions,
  isLoading, error,
} = useAdminUsers()
```

### `useAdminRoles`

```typescript
const {
  roles, loadRoles, createRole, updateRole, deleteRole,
  assignPermission, revokePermission,
  isLoading, error,
} = useAdminRoles()
```

### `useAdminPermissions`

```typescript
const {
  permissions, loadPermissions, createPermission, updatePermission, deletePermission,
  isLoading, error,
} = useAdminPermissions()
```

### `useAdminMeta`

```typescript
const { stats, loadStats, enumLabels, loadEnums } = useAdminMeta()
// enumLabels: { status: [{value, label}], permissionScope: [{value, label}] }
// loadEnums() result is cached at module level — safe to call multiple times
```

---

## Writing a New Composable

```typescript
// src/modules/my-module/presentation/composables/useMyFeature.ts
import { ref } from 'vue'
import { inject } from 'vue'
import { HTTP_CLIENT_KEY } from '@/shared/integration'
import { MyRepository } from '../../integration'
import { useErrorHandler } from '@/shared/presentation/composables/useErrorHandler'

export function useMyFeature() {
  const client = inject(HTTP_CLIENT_KEY)!
  const repo = new MyRepository(client)
  const { handleError, error } = useErrorHandler()

  const items = ref<MyDto[]>([])
  const loading = ref(false)

  async function loadItems() {
    loading.value = true
    try {
      const result = await repo.list()
      if (result.isSuccess) items.value = result.value
      else handleError(result.error)
    } catch (e) {
      handleError(e)
    } finally {
      loading.value = false
    }
  }

  return { items, loading, error, loadItems }
}
```
