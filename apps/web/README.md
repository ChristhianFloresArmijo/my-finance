# Vue DDD Template

Frontend for the full-stack DDD template. Paired with [`nestjs-prisma-ddd-template`](../nestjs-prisma-ddd-template).

**Stack:** Vue 3 · TypeScript · Tailwind v4 · Pinia · Vite · Vitest

## Quick start

```bash
cp .env.example .env   # set VITE_API_BASE_URL, VITE_BACKEND_TYPE, VITE_APP_NAME
pnpm dev               # http://localhost:5173
```

## Commands

```bash
pnpm dev            # dev server
pnpm build          # type-check + production build
pnpm type-check     # vue-tsc --noEmit
pnpm lint           # ESLint --fix
pnpm test:unit      # Vitest (single run)
pnpm test:coverage  # Vitest with v8 coverage
```

## Documentation

→ **[docs/](./docs/README.md)**

| | |
|---|---|
| [Setup](./docs/01-setup.md) | First run, env vars, Docker |
| [Architecture](./docs/02-architecture.md) | DDD layers, patterns |
| [Authentication](./docs/03-authentication.md) | JWT, 2FA, session handling |
| [Authorization](./docs/04-authorization.md) | RBAC, guards, `v-can` |
| [API Reference](./docs/05-api-reference.md) | All endpoints |
| [Database](./docs/06-database.md) | Schema, migrations, seeding |
| [Testing](./docs/07-testing.md) | Test patterns and commands |
| [Frontend Guide](./docs/08-frontend.md) | Composables, stores, HTTP layer |
