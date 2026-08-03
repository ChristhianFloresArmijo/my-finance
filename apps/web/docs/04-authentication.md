# Authentication — Frontend

The frontend authentication layer is backend-agnostic. It works through the `UserRepository` interface — the actual HTTP calls adapt to whatever backend is configured.

---

## Stores

### `authStore`

Located at `authentication/integration/stores/authStore.ts`.

```typescript
const authStore = useAuthStore()

authStore.user            // CurrentUserDto | null
authStore.isAuthenticated // computed: !!user
authStore.setUser(dto)    // populate after sign-in
authStore.clearUser()     // on sign-out / session expiry
```

`CurrentUserDto` includes `id`, `email`, `full_name`, `roles[]`, `permissions[]`, `profile`, `preferences`.

---

## Composables

### `useAuth`

```typescript
const {
  signIn,       // (dto: { email, password }) → Result
  signIn2fa,    // (pendingToken: string, code: string) → Result
  signOut,      // (redirectTo?: string | null) → void
  checkAuth,    // () → boolean  — fetches /auth/me and populates stores
  isLoading,
  error,
  authStore,
} = useAuth()
```

#### Standard sign-in

```typescript
const result = await signIn({ email, password })

if (!result.isSuccess) {
  // result.error — display to user
  return
}

if (result.value?.requires_2fa) {
  // show TOTP input, store result.value.totp_pending_token
  return
}

// user is authenticated — router guard will redirect
```

#### 2FA sign-in

```typescript
const result = await signIn2fa(pendingToken, totpCode)

if (!result.isSuccess) {
  // wrong code or expired token
}
```

#### Sign-out

```typescript
await signOut()              // clears stores, redirects to /auth/sign-in
await signOut('/admin/login') // redirect to custom path
await signOut(null)          // clear stores, no redirect
```

---

### `useTotp`

Manages the 2FA setup, enable, disable, and recovery code flows.

```typescript
const {
  fetchStatus,         // () → void  — loads current 2FA status
  startSetup,          // () → void  — requests a new TOTP secret + URI
  enable,              // (code: string) → boolean
  disable,             // (code: string) → boolean
  regenerateCodes,     // (code: string) → boolean
  clearRecoveryCodes,  // () → void

  status,              // Ref<{ totp_enabled, totp_enabled_at, recovery_codes_remaining } | null>
  setupUri,            // Ref<string | null>  — otpauth:// URI for QR code
  recoveryCodes,       // Ref<string[] | null>  — shown once after enable/regenerate

  statusLoading, setupLoading, enableLoading, disableLoading,
  statusError, setupError, enableError, disableError, regenError,
} = useTotp()
```

Typical setup flow in a view:

```typescript
// 1. Show QR code
await startSetup()
// setupUri.value is now set — render it as a QR code

// 2. User scans and enters their first code
const ok = await enable(userCode)
if (ok) {
  // recoveryCodes.value — show once and ask user to save
}
```

---

### `useSessions`

```typescript
const {
  loadSessions,      // (userId?: string) → void
  revokeSession,     // (sessionId: string) → void
  revokeAllSessions, // () → void

  sessions,          // Ref<SessionDto[]>
  loading,
  revokeLoadingId,   // Ref<string | null>  — ID of session currently being revoked
  error,
  revokeError,
} = useSessions()
```

---

## App Initialisation Flow

On every app load, `main.ts` calls `initAuth()` which runs `checkAuth()`:

```
initAuth()
  └─ checkAuth()
       └─ UserRepository.getCurrentUser()   → GET /auth/me (or equivalent)
            ├─ success → authStore.setUser(dto) + authorizationStore.setData(dto)
            └─ failure → authStore.clearUser()
```

The route guard in `router/index.ts` then reads `authStore.isAuthenticated` to allow or redirect.

---

## Session Expiry Handling

When the Axios interceptor detects a failed token refresh, it dispatches:

```javascript
window.dispatchEvent(new CustomEvent('auth:session-expired'))
```

`App.vue` listens and navigates via `router.push()` — no full page reload, which would restart the cycle.

---

## Route Guard

```typescript
// src/router/index.ts
router.beforeEach(async (to) => {
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    const ok = await checkAuth()
    if (!ok) return to.meta.adminRoute ? '/admin/login' : '/auth/sign-in'
  }
  if (to.meta.requiresRole) {
    if (!authorizationStore.hasAnyRole(to.meta.requiresRole)) return '/'
  }
})
```

Route meta:

```typescript
{
  path: '/admin',
  meta: { requiresAuth: true, requiresRole: ['admin', 'superadmin'] }
}
```
