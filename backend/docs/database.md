# Database schema

Source of truth: `prisma/schema.prisma`. Provider: Supabase Postgres. One migration so far: `prisma/migrations/20260723204814_init/`.

**Prisma is pinned to 6.19.3** (`@prisma/client` and `prisma` both `6.19.3` exact, not `^7.x`). `npx prisma init` on a fresh install pulls Prisma 7, which switches to a `prisma.config.ts`-based setup, a `prisma-client` generator with a custom output path, and auto-installs agent-skills folders (`.claude/skills`, `.windsurf/skills`, etc.) that aren't wanted here. This schema deliberately uses the classic `provider = "prisma-client-js"` generator with no custom output. Don't bump the major version without re-deciding this.

Two connection strings (`.env`): `DATABASE_URL` (pooled, transaction mode, port 6543 — used by the app at runtime) and `DIRECT_URL` (session mode, port 5432 — used only by `prisma migrate`).

## Enum

- **`HabitFrequency`**: `daily | weekdays | weekends`

## Models

### `Profile` (table `profiles`)
Mirrors a Supabase `auth.users` row. `id` is the Supabase `auth.uid()` value — no default, set explicitly by the app (see `AuthService.ensureProfile`, [modules/auth.md](modules/auth.md)) rather than Prisma-generated.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @db.Uuid` | = Supabase user id |
| `name` | `String?` | from JWT `user_metadata.name` |
| `createdAt` | `DateTime @default(now())` | `created_at` |

Relations: `habits[]`, `habitCompletions[]`, `cats[]`, `aiRecommendations[]`.

### `Habit` (table `habits`) — implemented, see [modules/habits.md](modules/habits.md)

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `userId` | `String @db.Uuid` | `user_id`, FK → `Profile`, cascade delete |
| `title` | `String @db.VarChar(100)` | |
| `description` | `String? @db.VarChar(500)` | |
| `frequency` | `HabitFrequency @default(daily)` | |
| `reminderTime` | `DateTime? @db.Time()` | `reminder_time`, time-of-day only |
| `isActive` | `Boolean @default(true)` | `is_active` |
| `createdAt` | `DateTime @default(now())` | `created_at` |

Indexes: `[userId]`, `[userId, isActive]`. Relation: `completions HabitCompletion[]`.

### `HabitCompletion` (table `habit_completions`) — implemented

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `habitId` | `String @db.Uuid` | `habit_id`, FK → `Habit`, cascade |
| `userId` | `String @db.Uuid` | `user_id`, FK → `Profile`, cascade |
| `completionDate` | `DateTime @db.Date` | `completion_date`, date-only (UTC — see [modules/habits.md](modules/habits.md)) |
| `createdAt` | `DateTime @default(now())` | `created_at` |

Constraints: unique `[habitId, completionDate]` (one completion row per habit per day), index `[userId, completionDate]`.

### `Cat` (table `cats`) — **modeled, not yet implemented**

Gamification "pet" entity — 1:1 with `Profile`. No NestJS module consumes this yet.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `userId` | `String @unique @db.Uuid` | `user_id`, FK → `Profile`, cascade, unique = 1:1 |
| `name` | `String @default("Paw")` | |
| `createdAt` | `DateTime @default(now())` | `created_at` |
| `updatedAt` | `DateTime @updatedAt` | `updated_at` |

Cat-mood thresholds (product decision, not yet coded anywhere): daily habit completion `≥50% → happy`, `1–49% → neutral`, `0%` or no habits scheduled `→ sad/neutral`.

### `AiRecommendation` (table `ai_recommendations`) — **modeled, not yet implemented**

Intended for Gemini-generated habit suggestions (`@google/generative-ai` is a dependency; `GEMINI_API_KEY`/`GEMINI_MODEL`/`AI_THROTTLE_LIMIT`/`AI_THROTTLE_TTL_MS` are already validated in `env.validation.ts`). No NestJS module consumes this yet.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `userId` | `String @db.Uuid` | `user_id`, FK → `Profile`, cascade |
| `goal` | `String? @db.VarChar(300)` | |
| `requestContext` | `Json` | `request_context` — inputs sent to the model |
| `suggestions` | `Json` | model output |
| `model` | `String @db.VarChar(50)` | which Gemini model produced this |
| `createdAt` | `DateTime @default(now())` | `created_at` |

Index: `[userId, createdAt]`.

## Relations diagram (text)

```
Profile 1──* Habit 1──* HabitCompletion
   │                        ↑ (also FK'd directly to Profile for query convenience)
   ├──1 Cat
   └──* AiRecommendation
```
