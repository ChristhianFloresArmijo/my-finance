# Setup — Frontend

## Prerequisites

- Node.js 20+
- pnpm 8+
- A running backend (see the backend repo's own setup guide)

---

## Environment

```bash
cp .env.example .env
```

```env
VITE_API_BASE_URL=http://localhost:3000/api   # backend base URL
VITE_BACKEND_TYPE=nestjs                      # nestjs | django | dotnet
VITE_APP_NAME=MyApp
```

`VITE_BACKEND_TYPE` controls which adapter is loaded — see [03 — HTTP & Backend Adapters](./03-http-adapters.md).

---

## Start

```bash
pnpm dev    # Vite dev server → http://localhost:5173
```

---

## Commands

```bash
pnpm dev            # dev server (hot reload)
pnpm build          # type-check + production build
pnpm type-check     # vue-tsc --noEmit only
pnpm lint           # ESLint --fix
pnpm test:unit      # Vitest (single run)
pnpm test           # Vitest (watch mode)
pnpm test:coverage  # Vitest with v8 coverage report
```

---

## Path Alias

All imports use `@/` → `src/`:

```typescript
import { useAuth } from '@/modules/authentication/presentation/composables/useAuth'
import { HTTP_CLIENT_KEY } from '@/shared/integration'
```

Configured in `vite.config.ts` and `tsconfig.json`.

---

## Tailwind v4 Rules

- Use `@custom-variant dark` — **not** `darkMode: 'class'` in a config file
- Never use `@apply` inside `<style scoped>`
- Inline utility classes only
