# NestJS Prisma DDD Template

Backend for the full-stack DDD template. Paired with [`vue-ddd-template`](../vue-ddd-template).

**Stack:** NestJS · Prisma · PostgreSQL · CQRS · JWT · TypeScript

## Quick start

```bash
cp .env.example .env   # set JWT secrets, DB credentials, admin password
docker compose up -d   # starts API (3000), PostgreSQL (5432), Adminer (8080), MailHog (8025)
pnpm prisma:migrate    # apply migrations
pnpm prisma:seed       # create superadmin + default roles/permissions
```

## Commands

```bash
pnpm dev              # start with hot reload
pnpm build            # production build
pnpm lint             # ESLint --fix
pnpm test             # Jest (all specs)
pnpm test:e2e         # e2e tests (requires live DB)

pnpm prisma:migrate   # create + apply migration
pnpm prisma:generate  # regenerate Prisma client
pnpm prisma:reset     # drop DB + replay migrations + seed
pnpm prisma:studio    # open Prisma Studio
pnpm prisma:seed      # run seed only
```

## Services

| Service | URL |
|---|---|
| API | http://localhost:3000 |
| API reference (Scalar) | http://localhost:3000/reference |
| Adminer (DB UI) | http://localhost:8080 |
| MailHog (email) | http://localhost:8025 |

## Documentation

→ **[docs/README.md](./docs/README.md)**

| | |
|---|---|
| [Setup](./docs/01-setup.md) | First run, env vars, Docker |
| [Architecture](./docs/02-architecture.md) | DDD layers, CQRS patterns |
| [Authentication](./docs/03-authentication.md) | JWT, 2FA, session handling |
| [Authorization](./docs/04-authorization.md) | RBAC, guards, decorators |
| [API Reference](./docs/05-api-reference.md) | All endpoints |
| [Database](./docs/06-database.md) | Schema, migrations, seeding |
| [Testing](./docs/07-testing.md) | Test patterns and commands |
