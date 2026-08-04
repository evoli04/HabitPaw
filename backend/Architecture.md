# HabitPaw Backend — Architecture

Habit tracker API with a cat-mood gamification layer. NestJS backend, Supabase for Postgres + Auth. This file is the entry point for understanding the backend without reading `src/` — see [Module Index](#module-index) for per-module detail.

## Tech stack

| Layer | Choice | Notes |
|---|---|---|
| Runtime/framework | NestJS 11 | modular DI, decorators |
| Language | TypeScript 5.7 | `strictNullChecks` on, full `strict` off |
| ORM | Prisma 6.19.3 (pinned) | see [docs/database.md](docs/database.md) for why pinned below 7.x |
| Database | Supabase Postgres | accessed via pooled connection strings, see [Env vars](#env-vars) |
| Auth | Supabase Auth (JWT, ES256) | backend only *verifies* tokens — see [Auth flow](#auth-flow) |
| Validation | class-validator / class-transformer | via global `ValidationPipe` |
| Config | `@nestjs/config` + Joi | `src/config/env.validation.ts` |
| API docs | `@nestjs/swagger` (OpenAPI 3) | served at `/api/docs` |
| Auth strategy | Passport (`passport-jwt` + `jwks-rsa`) | verifies against Supabase's JWKS endpoint |
| AI | `@google/genai` (Gemini, AI Studio) | habit suggestions — see [docs/modules/ai.md](docs/modules/ai.md) |
| Rate limiting | `@nestjs/throttler` | applied to the AI routes only |

## Dev commands

Run from `backend/`:

| Command | Purpose |
|---|---|
| `npm run start:dev` | dev server, watch mode, `http://localhost:3000` |
| `npm run build` | `nest build` → `dist/` |
| `npm run start:prod` | run built output (`node dist/main`) |
| `npm run lint` | eslint --fix over `src`/`test` |
| `npm run format` | prettier --write |
| `npm test` | unit tests (jest) |
| `npm run test:e2e` | e2e tests (`test/jest-e2e.json`) |
| `npx prisma migrate dev` | create + apply a migration from schema changes |
| `npx prisma generate` | regenerate the Prisma client (after pulling schema changes) |
| `npx prisma studio` | GUI DB browser against `DATABASE_URL` |

Swagger UI: `http://localhost:3000/api/docs` (gated by `SWAGGER_ENABLED` env var).

## Request flow

```
client
  → /api  (global prefix, main.ts)
  → ValidationPipe (whitelist + forbidNonWhitelisted + transform)
  → JwtAuthGuard (global, APP_GUARD in AuthModule)
      - skipped if route/controller has @Public()
      - otherwise: verifies bearer JWT against Supabase JWKS (ES256)
      - on success: AuthService.ensureProfile(sub) — JIT-upserts a Profile row
      - attaches AuthenticatedUser {id, email} to request.user
  → Controller (@CurrentUser() reads request.user)
  → Service (business logic, always scoped by userId)
  → PrismaService → Supabase Postgres
```

## Auth flow

Supabase is the identity provider. The intended production flow is entirely client-side: a frontend uses the Supabase SDK to register/login/refresh, and sends the resulting JWT as `Authorization: Bearer <token>` to this API. **The backend has no production login/register endpoints** — it only verifies tokens (`src/auth/strategies/jwt.strategy.ts`) and does just-in-time profile provisioning.

**Exception — dev/testing login for Swagger.** `POST /api/auth/login` (`src/auth/auth.controller.ts`) proxies Supabase's password-grant Auth REST API so a developer can get a token *from inside Swagger* instead of using curl/Postman against Supabase directly:

1. Open `http://localhost:3000/api/docs`.
2. Expand `auth` → `POST /auth/login`, "Try it out", submit a real Supabase user's `email`/`password`.
3. Copy `access_token` from the response.
4. Click "Authorize" (top right), paste the token into the `access-token` bearer scheme, confirm.
5. All `@ApiBearerAuth('access-token')` endpoints (e.g. `habits`) now execute as that user.

This endpoint is not meant for production clients — it exists solely so the whole auth loop can be exercised without leaving Swagger.

## Module index

- [docs/modules/auth.md](docs/modules/auth.md) — JWT verification, guard, dev login endpoint
- [docs/modules/habits.md](docs/modules/habits.md) — habit CRUD + daily completion tracking
- [docs/modules/ai.md](docs/modules/ai.md) — Gemini habit suggestions, model/quota troubleshooting
- [docs/modules/prisma.md](docs/modules/prisma.md) — global Prisma client module
- [docs/modules/common.md](docs/modules/common.md) — `@Public()`/`@CurrentUser()`, health check
- [docs/modules/config.md](docs/modules/config.md) — env validation
- [docs/database.md](docs/database.md) — full Prisma schema, including models not yet consumed by any module

## Env vars

Validated in `src/config/env.validation.ts` (Joi). Template in `.env.example`.

| Var | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | yes | — | `production` \| `development` \| `test` |
| `PORT` | no | `3000` | HTTP port |
| `DATABASE_URL` | yes | — | Supabase pooled connection (transaction mode, :6543), runtime queries |
| `DIRECT_URL` | yes | — | Supabase session-mode connection (:5432), used by Prisma migrations |
| `SUPABASE_URL` | yes | — | Supabase project base URL, used by the dev login endpoint |
| `SUPABASE_JWKS_URL` | yes | — | JWKS endpoint the JWT strategy verifies tokens against |
| `SUPABASE_PUBLISHABLE_KEY` | yes | — | Supabase public API key, sent as `apikey` header when proxying login |
| `GEMINI_API_KEY` | yes | — | Google AI Studio key used by the AI module |
| `GEMINI_MODEL` | yes | — | must be a model the key can still call — retired ids 404, see [docs/modules/ai.md](docs/modules/ai.md#troubleshooting) |
| `AI_THROTTLE_LIMIT` | no | `5` | requests per window on `/api/ai/*` |
| `AI_THROTTLE_TTL_MS` | no | `3600000` | throttle window in ms |
| `CORS_ORIGIN` | no | `*` | **currently unused** — see [Known gaps](#known-gaps), `app.enableCors()` is never called |
| `SWAGGER_ENABLED` | no | `true` | gates Swagger setup in `main.ts` |

`.env` also carries `SUPABASE_SECRET_KEY` (service-role-equivalent secret) which is not referenced anywhere in `src/` yet — reserved for a future admin/server-side Supabase SDK use case. `.env` is git-ignored; never commit it.

## Known gaps

Tracked here instead of re-discovered each session:

- **CORS never enabled.** `CORS_ORIGIN` is validated but `app.enableCors()` is never called in `main.ts` — dead config.
- **Helmet installed, unused.** `helmet` is a dependency but `helmet()` is never called in `main.ts`. (`ThrottlerModule` is now wired — but only inside `AiModule`, see [docs/modules/ai.md](docs/modules/ai.md).)
- **JWT strategy doesn't validate `iss`/`aud`.** `src/auth/strategies/jwt.strategy.ts` only checks the signature (ES256, via JWKS) — any token signed by the same Supabase project's key is accepted regardless of issuer/audience claims.
- **`PrismaService` connect/disconnect not awaited.** `onModuleInit`/`onModuleDestroy` call `this.$connect()`/`this.$disconnect()` without `await`, despite being `async` methods.
- **Root `/` route (`AppController.getHello`) has no `@Public()`.** It's excluded from Swagger (`@ApiExcludeController()`) but not exempted from the global `JwtAuthGuard`, so it likely 401s — leftover Nest starter boilerplate, not otherwise used.
- **`cats` is modeled, not implemented.** `Cat` exists in `prisma/schema.prisma` (see [docs/database.md](docs/database.md)) but has no NestJS module/controller/service. The root prototype `petStatusMotor.js` writes `mood`/`health`/`dialogue`/`urgent_task` columns that the `Cat` model does not have — schema and prototype disagree. (`AiRecommendation` is now consumed by [docs/modules/ai.md](docs/modules/ai.md).)
- **Config access is inconsistent.** Most of the app reads env vars via injected `ConfigService`; `jwt.strategy.ts` and `main.ts`'s port read raw `process.env` instead. Functionally fine (Joi validates at startup either way) but worth normalizing eventually.
