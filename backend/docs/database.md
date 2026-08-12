# Database schema

Source of truth: `prisma/schema.prisma`. Provider: Supabase Postgres. Two migrations: `prisma/migrations/20260723204814_init/` and `20260811232917_add_coins_and_shop/`.

**Prisma is pinned to 6.19.3** (`@prisma/client` and `prisma` both `6.19.3` exact, not `^7.x`). `npx prisma init` on a fresh install pulls Prisma 7, which switches to a `prisma.config.ts`-based setup, a `prisma-client` generator with a custom output path, and auto-installs agent-skills folders (`.claude/skills`, `.windsurf/skills`, etc.) that aren't wanted here. This schema deliberately uses the classic `provider = "prisma-client-js"` generator with no custom output. Don't bump the major version without re-deciding this.

Two connection strings (`.env`): `DATABASE_URL` (pooled, transaction mode, port 6543 — used by the app at runtime) and `DIRECT_URL` (session mode, port 5432 — used only by `prisma migrate`).

## Enums

- **`HabitFrequency`**: `daily | weekdays | weekends`
- **`CoinTransactionType`**: `habit_reward | purchase`

## Models

### `Profile` (table `profiles`)
Mirrors a Supabase `auth.users` row. `id` is the Supabase `auth.uid()` value — no default, set explicitly by the app (see `AuthService.ensureProfile`, [modules/auth.md](modules/auth.md)) rather than Prisma-generated.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @db.Uuid` | = Supabase user id |
| `name` | `String?` | from JWT `user_metadata.name` |
| `coinBalance` | `Int @default(0)` | `coin_balance` — running total of `coin_transactions`, see [modules/coins.md](modules/coins.md) |
| `createdAt` | `DateTime @default(now())` | `created_at` |

Relations: `habits[]`, `habitCompletions[]`, `cats[]`, `aiRecommendations[]`, `coinTransactions[]`, `shopItems[]`.

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

Cat-mood thresholds (product decision, not yet coded anywhere): daily habit completion `≥50% → happy`, `1–49% → neutral`, `0%` or no habits scheduled `→ sad/neutral`. Note the shipped mobile app uses a *five*-step scale instead (`mobile/src/utils/catMood.js`: `0% sad`, `<40% sleepy`, `<70% neutral`, `<100% happy`, `100% excited`) — mood is computed client-side, so this row has never been the authority.

### `CoinTransaction` (table `coin_transactions`) — implemented, see [modules/coins.md](modules/coins.md)

Append-only coin ledger. `profiles.coin_balance` is a running total of these rows; both are written in the same transaction so they cannot drift.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `userId` | `String @db.Uuid` | `user_id`, FK → `Profile`, cascade |
| `amount` | `Int` | positive = earned, negative = spent |
| `type` | `CoinTransactionType` | `habit_reward` or `purchase` |
| `habitId` | `String? @db.Uuid` | `habit_id`, FK → `Habit`, **`onDelete: SetNull`** — deleting a habit must not erase the reason a balance exists |
| `rewardDate` | `DateTime? @db.Date` | `reward_date`, UTC day the reward was earned for |
| `shopItemId` | `String? @db.VarChar(50)` | `shop_item_id`, catalog id on purchase rows |
| `createdAt` | `DateTime @default(now())` | `created_at` |

Constraints: `@@unique([habitId, rewardDate])` — **one reward per habit per day, enforced by the database.** Purchase rows leave both columns NULL and Postgres treats NULLs as distinct, so they are unaffected. Index: `[userId, createdAt]`.

### `UserShopItem` (table `user_shop_items`) — implemented, see [modules/shop.md](modules/shop.md)

Accessory ownership. The catalog itself (name, price, artwork) is **not** in the database — `src/shop/shop-catalog.ts` plus images bundled in the app.

| Field | Type | Notes |
|---|---|---|
| `id` | `String @id @default(uuid())` | |
| `userId` | `String @db.Uuid` | `user_id`, FK → `Profile`, cascade |
| `itemId` | `String @db.VarChar(50)` | `item_id`, catalog id — treat as permanent, renaming orphans rows |
| `pricePaid` | `Int` | `price_paid`, snapshot so later price changes don't rewrite history |
| `equipped` | `Boolean @default(false)` | at most one true per user, held by the service not the schema |
| `createdAt` | `DateTime @default(now())` | `created_at` |

Constraints: `@@unique([userId, itemId])` — an item cannot be bought twice. Index: `[userId]`.

### `AiRecommendation` (table `ai_recommendations`)

Gemini-generated habit suggestions, written by `AiService.suggestHabits` and read back by
`AiService.acceptSuggestions` — see [modules/ai.md](modules/ai.md). One row per generation; rows are
kept after acceptance as the audit trail of what the model proposed.

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
   │           │            ↑ (also FK'd directly to Profile for query convenience)
   │           └──* CoinTransaction  (habit_reward rows; SetNull on habit delete)
   ├──1 Cat
   ├──* AiRecommendation
   ├──* CoinTransaction
   └──* UserShopItem
```
