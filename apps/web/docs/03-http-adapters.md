# HTTP & Backend Adapters

The frontend is designed to work with any backend. The adapter layer normalises request/response shape and error format so the rest of the app never needs to know which backend it's talking to.

---

## Architecture

```
composable
  └─ repository (uses AdaptedHttpClient)
       └─ AdaptedHttpClient(axiosClient, adapter)
            ├─ AxiosHttpClient      ← sends the actual HTTP request
            └─ BackendAdapter       ← transforms req/res to/from a standard shape
```

`AdaptedHttpClient` is provided at the app root and injected into repositories via `HTTP_CLIENT_KEY`:

```typescript
// src/main.ts
import { createAxiosClient } from '@/shared/integration'
import { AdaptedHttpClient, NestJSAdapter } from '@/shared/integration'

const axiosClient = createAxiosClient({ baseURL: import.meta.env.VITE_API_BASE_URL })
const adapter = new NestJSAdapter()

app.provide(HTTP_CLIENT_KEY, new AdaptedHttpClient(axiosClient, adapter))
```

Repositories inject it:

```typescript
export function useAuth() {
  const client = inject(HTTP_CLIENT_KEY)!
  const repo = new UserRepository(client)
  // ...
}
```

---

## Selecting an Adapter

Set `VITE_BACKEND_TYPE` in `.env`:

```env
VITE_BACKEND_TYPE=nestjs    # default
VITE_BACKEND_TYPE=django
VITE_BACKEND_TYPE=dotnet
```

`src/config/app.config.ts` reads this variable and `main.ts` instantiates the correct adapter.

---

## Available Adapters

| Adapter | Backend | File |
|---|---|---|
| `NestJSAdapter` | NestJS + class-validator | `src/shared/integration/adapters/NestJSAdapter.ts` |
| `DjangoAdapter` | Django REST Framework | `src/shared/integration/adapters/DjangoAdapter.ts` |

---

## Writing a New Adapter

Implement the `BackendAdapter` interface:

```typescript
// src/shared/integration/adapters/BackendAdapter.ts
export interface BackendAdapter {
  transformRequest(config: RequestConfig): RequestConfig
  transformResponse<T>(response: AxiosResponse): T
  transformError(error: unknown): AppError
}
```

Example skeleton for a .NET minimal API adapter:

```typescript
// src/shared/integration/adapters/DotNetAdapter.ts
import type { BackendAdapter } from './BackendAdapter'

export class DotNetAdapter implements BackendAdapter {
  transformRequest(config) {
    // .NET uses camelCase by default — usually no transformation needed
    return config
  }

  transformResponse<T>(response) {
    // .NET minimal API returns the resource directly — unwrap if needed
    return response.data as T
  }

  transformError(error) {
    // Map ProblemDetails format to AppError
    const detail = error?.response?.data
    return {
      message: detail?.title ?? 'An error occurred',
      status: detail?.status ?? 500,
      errors: detail?.errors ?? {},
    }
  }
}
```

Then register it in `main.ts`:

```typescript
import { DotNetAdapter } from '@/shared/integration/adapters/DotNetAdapter'

const adapter = new DotNetAdapter()
app.provide(HTTP_CLIENT_KEY, new AdaptedHttpClient(axiosClient, adapter))
```

---

## Axios Interceptor Behaviour

The `AxiosHttpClient` has one interceptor that handles token refresh automatically:

1. Every request is sent with `withCredentials: true` (cookies attached)
2. On 401 → attempts `POST /auth/refresh` (or equivalent endpoint) once
3. If refresh succeeds → retries the original request with the new token
4. If refresh fails → dispatches `auth:session-expired` custom DOM event

`App.vue` listens for `auth:session-expired` and navigates to the login page via `router.push()` — no hard reload:

```typescript
// App.vue
function handleSessionExpired() {
  const isAdminRoute = route.path.startsWith('/admin')
  router.push(isAdminRoute ? '/admin/login' : '/auth/sign-in')
}
onMounted(() => window.addEventListener('auth:session-expired', handleSessionExpired))
onUnmounted(() => window.removeEventListener('auth:session-expired', handleSessionExpired))
```

The refresh endpoint path and cookie names are configurable per adapter. Override `getRefreshEndpoint()` in your adapter if the backend uses a different path than `/auth/refresh`.

---

## Repository Contract

Each repository module owns a TypeScript interface in `business/repositories/`. The interface defines what the composable layer can call — it has no HTTP or framework details:

```typescript
// authentication/business/repositories/user.repository.interface.ts
export interface IUserRepository {
  signIn(dto: SignInDto): Promise<Result<SignInResponseDto | TotpPendingDto, string>>
  signOut(): Promise<void>
  getCurrentUser(): Promise<Result<CurrentUserDto, string>>
  // ...
}
```

The concrete `UserRepository` in `integration/repositories/` implements this interface using `AdaptedHttpClient`. When you switch backends, you may need to adjust endpoint paths or response shapes in the repository — the composables and views stay untouched.
