# Stack Tecnológico

Este documento reemplaza la sección "Tecnologías sugeridas" del borrador original. El borrador
proponía React + Django; el proyecto real ya está construido sobre Vue 3 + NestJS, así que esta es
la referencia vigente.

## Resumen

| Capa | Tecnología real | Nota vs. borrador original |
|---|---|---|
| Frontend | Vue 3 · TypeScript · Vite · Tailwind CSS v4 · Pinia | El borrador sugería React; se optó por Vue |
| Estado servidor (frontend) | TanStack Query (`@tanstack/vue-query`) | Igual intención que el borrador (TanStack Query) |
| Formularios (frontend) | vee-validate + Zod (`@vee-validate/zod`) | El borrador sugería React Hook Form; equivalente en Vue |
| Componentes UI (frontend) | Ark UI (`@ark-ui/vue`) + Iconify | No estaba en el borrador |
| Backend | NestJS (Node.js/TypeScript) | El borrador sugería Django; se optó por NestJS |
| API | NestJS + `@nestjs/cqrs` (patrón CQRS) | El borrador sugería Django REST Framework |
| Base de datos | PostgreSQL vía Prisma ORM | Igual que el borrador (PostgreSQL) |
| Autenticación | JWT (cookies) + TOTP (2FA) + códigos de recuperación | Passkeys y OAuth siguen pendientes |
| Validación (backend) | class-validator (DTOs) + Valibot (entidades de dominio) | No especificado en el borrador |
| Almacenamiento de archivos | `@aws-sdk/client-s3` (S3 o compatible, ej. MinIO en local) | Coincide con el borrador |
| Contenedores | Docker + Docker Compose (uno por app, orquestados desde la raíz) | Coincide con el borrador |
| Gestor de paquetes | pnpm workspaces (monorepo) | No especificado en el borrador |
| Testing backend | Jest (unit + e2e) | Coincide con el borrador (implícito) |
| Testing frontend | Vitest (unit) + Playwright (e2e) | No especificado en el borrador |

## Decisiones que se apartan del borrador y por qué

**Gráficas: Apache ECharts vía `vue-echarts`, no Recharts.** Recharts es una librería de React y no
aplica a un frontend Vue. El borrador ya mencionaba ECharts como alternativa — se adopta esa opción.
Todos los módulos que requieren gráficas (dashboard, reportes, estadísticas, patrimonio) deben usar
esta misma librería para mantener consistencia visual.

**Cache/colas: sin Redis ni Celery por ahora.** El borrador sugería Redis + Celery, que son piezas
típicas de un stack Python/Django. El backend actual usa `@nestjs/schedule` (cron jobs in-process)
para tareas periódicas (ya se usa para limpiar refresh tokens). Esto es suficiente para el MVP y las
fases 2-3. Cuando aparezcan necesidades reales de cola de trabajos asíncronos — recálculo masivo de
intereses, importaciones grandes de CSV/OFX, recordatorios push, o las funciones de IA de la fase 5 —
la recomendación es introducir **Redis + BullMQ** (el equivalente en el ecosistema Node a Redis +
Celery), no antes. No agregar esta infraestructura de forma especulativa.

**Sin OAuth ni Passkeys todavía.** JWT + 2FA/TOTP + códigos de recuperación ya están implementados y
cubren el requisito de seguridad para uso personal. OAuth y Passkeys quedan en el backlog de
seguridad, no bloquean ningún módulo financiero.

## Convenciones de nomenclatura de módulos por área

| Área | Estado | Módulos backend (`apps/api/src/modules/`) | Módulos frontend (`apps/web/src/modules/`) |
|---|---|---|---|
| Identidad y acceso | Ya construido | `account`, `authentication`, `authorization`, `meta`, `shared` | `authentication`, `account`, `authorization`, `admin`, `home` |
| Dominio financiero | Por construir | módulos planos bajo `modules/` (ver [03 — Arquitectura](./03-arquitectura.md)) | ídem |

> **Por qué `financial_accounts` y no `accounts` a secas:** el módulo `account` ya existe y
> significa "cuenta de usuario" (perfil, preferencias, contraseña). Una "cuenta bancaria" del
> dominio financiero es un concepto distinto. Solo este módulo necesita un nombre que lo distinga —
> las cuentas financieras viven en `financial_accounts` con la entidad `FinancialAccount`, nunca en el
> módulo `account` existente ni con el nombre `accounts` a secas. Ningún otro módulo financiero
> (`transactions`, `budgets`, `debts`, …) choca con nada existente, así que no llevan ningún prefijo
> ni sufijo especial — ver el razonamiento completo en
> [03 — Arquitectura](./03-arquitectura.md#organización-de-módulos-todo-plano-bajo-modules-sin-prefijo-salvo-colisión-real).

## Infraestructura de desarrollo

Cada app mantiene su propio `docker-compose.yml` (Postgres, Adminer, Mailhog para `apps/api`); el
`docker-compose.yml` de la raíz solo los incluye (`include:`) para levantar todo con un comando desde
el monorepo. Esto no cambia con la incorporación del dominio financiero — no se crean nuevos
servicios de infraestructura para el MVP.
