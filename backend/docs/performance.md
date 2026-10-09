# Performance

Measured 2026-08-12, right after the Supabase project moved from `ap-northeast-2` (Seoul) to `eu-central-1` (Frankfurt). Backend running locally in Turkey; database in Frankfurt.

## The one number that explains everything

```
TCP round trip to the Frankfurt pooler          ~50 ms
One Prisma query through the transaction pooler ~260 ms
```

A query costs **five network round trips**, not one. `?pgbouncer=true` puts Supavisor in transaction mode, which disables prepared-statement caching; Prisma re-issues parse/bind/describe/execute/sync every time.

**So the bottleneck is the number of queries, not their cost.** With 15 habits and 5 profiles, no index and no query plan matters — the database does no measurable work. Everything below is about round trips and distance. Do not spend time tuning SQL here until the dataset is orders of magnitude larger.

## Endpoint latency

Median of 5 calls, real JWT, temporary account created and deleted per run.

| Endpoint | Before | After code fixes | + session pooler |
|---|---:|---:|---:|
| `GET /health` (no DB) | 2 ms | 3 ms | 3 ms |
| `GET /habits` | 743 ms | 267 ms | **60 ms** |
| `GET /habits/today` | 854 ms | 370 ms | 115 ms |
| `GET /progress?range=week` | 749 ms | 270 ms | 65 ms |
| `GET /progress?range=month` | 746 ms | 263 ms | 60 ms |
| `GET /coins` | 746 ms | 365 ms | 116 ms |
| `GET /shop/items` | 745 ms | 365 ms | 114 ms |
| `POST /habits/:id/complete` | 1225 ms | 729 ms | 332 ms |
| `POST /habits/:id/claim-reward` | 1545 ms | 885 ms | 339 ms |
| `PUT /shop/equipped` | 1013 ms | 623 ms | 284 ms |
| `POST /ai/…/accept` (3 suggestions) | 1548 ms | 745 ms | 443 ms |

`GET /health` at 2 ms is the control: the HTTP layer is not the problem.

## What was changed

### `ensureProfile` no longer runs a query per request — the biggest single win

[`auth.service.ts`](../src/auth/auth.service.ts). `JwtStrategy.validate` calls it on **every** authenticated request, so its cost was charged to every endpoint. Measured in isolation:

```
profile.upsert   484 ms   ← was running on every request
habit.findMany   269 ms   ← the actual work
sequential       755 ms   ← matches the 743 ms observed for GET /habits
```

Two changes: an in-memory `Set` of user ids short-circuits repeat callers, and the miss path uses `createMany({ skipDuplicates: true })` — one `INSERT … ON CONFLICT DO NOTHING` instead of the `SELECT` + `INSERT`/`UPDATE` pair Prisma compiles `upsert` into.

Behaviour is identical: the old `upsert` passed `update: {}`, so an existing profile was never modified either.

The set is unbounded, which is fine at this scale (bounded by distinct users per process, and a restart just re-checks each once). If the app ever deletes profile rows at runtime, this cache becomes stale and needs invalidation.

**Superseded 2026-10-08:** `ensureProfile` and the set are gone. A database trigger on `auth.users` (migration `20261008200000_create_profile_on_signup`) creates the profile when Supabase Auth creates the user, so `JwtStrategy.validate` does no database work at all — not even once per user per process. Existing users were backfilled by the same migration. Measured afterwards (warm, local backend → Frankfurt): `GET /habits` 130–250 ms, `GET /habits/today` 240–260 ms, each with zero `profiles` queries in the log.

### `$connect()` is awaited

[`prisma.service.ts`](../src/prisma/prisma.service.ts). Nest used to finish booting while the connection was still opening, so the first request paid ~1.1 s. This matters much more once deployed on a platform that sleeps idle instances.

### Sequential awaits collapsed into batches

| Where | Was | Now |
|---|---|---|
| [`ai.service.ts`](../src/ai/ai.service.ts) `acceptSuggestions` | `for` loop of awaited `create` — one round trip per suggestion | `HabitsService.createMany`, array-form `$transaction`, one batch |
| [`habits.service.ts`](../src/habits/habits.service.ts) `claimReward` | `findOneOrThrow` then a separate completion lookup | one `findFirst` whose relation filter carries the completion check |
| [`coins.service.ts`](../src/coins/coins.service.ts) `awardHabitReward` | interactive `$transaction` — round trips for BEGIN, insert, update, COMMIT | array-form `$transaction`, one batch, still atomic |
| [`coins.service.ts`](../src/coins/coins.service.ts) `spend` | `updateMany` + insert + `findUniqueOrThrow` | raw `UPDATE … WHERE coin_balance >= $1 RETURNING coin_balance` — guard and value in one statement |
| `getWallet`, `ShopService.listItems` | two parallel queries | one query with a nested relation `select` |

`createMany` was rejected for the AI path because it does not return the created rows and the caller needs them; the array form of `$transaction` batches *and* returns.

Behaviour was held constant throughout — the 36-assertion coin/shop scenario (temporary profile, full flow, cascade cleanup) passed before and after, including idempotency, the 400/409 split and ledger-versus-balance consistency.

## Connection mode: transaction pooler vs session pooler

Same measurements, only the connection string changed. Two runs each, interleaved:

| | 1 query | 5 sequential | 5 parallel | batch | `findMany` |
|---|---:|---:|---:|---:|---:|
| transaction pooler `:6543` (`?pgbouncer=true`) | 265 ms | 1314 ms | 260 ms | 367 ms | 262 ms |
| **session pooler `:5432`** | **53 ms** | **265 ms** | **53 ms** | 212 ms | **53 ms** |

53 ms is the network round trip. Session mode costs **one** round trip per query; transaction mode costs about five.

**Recommendation: point `DATABASE_URL` at the session pooler with an explicit `connection_limit`.** Not yet applied — it is a runtime configuration decision, and `.env` is not committed.

```
DATABASE_URL="postgresql://…@aws-0-eu-central-1.pooler.supabase.com:5432/postgres?connection_limit=5"
```

Note the deliberate absence of `?pgbouncer=true` — that flag is what disables prepared statements.

**The trade-off is connection count, not correctness.** Session mode holds one server connection per client connection for its whole lifetime; transaction mode hands connections back between statements and therefore supports far more concurrent clients. One backend process with `connection_limit=5` is comfortable. Before scaling to several instances, re-check the project's connection allowance and re-measure — this is the setting to revisit first if connections start being refused under load.

`DIRECT_URL` must stay on the session pooler regardless: `prisma migrate` cannot run through transaction pooling.

## What is deliberately not done

- **No indexes added, no query plans tuned.** The dataset is tiny; the database is not the constraint. Adding indexes here would be cargo cult.
- **No caching layer.** Response caching would hide the real problem (distance) and introduce invalidation bugs for data that changes on every user action.
- **Nothing in the HTTP layer.** `GET /health` at 2 ms rules it out.

## 2026-10-08 follow-up

Measured with `PERF_LOG=true`, which logs per-request wall time (Express middleware, so it includes the JWT guard), every Prisma query with its duration, and Gemini latency with token counts.

| Change | Before | After |
|---|---|---|
| Profile creation moved to an `auth.users` trigger (see `ensureProfile` above) | 0–1 queries per request | 0 |
| `POST /habits/:id/complete` as one raw SQL statement (ownership CTE + `INSERT … ON CONFLICT DO NOTHING` + existing-row fallback) | 6 queries (`findFirst`, then `upsert` = BEGIN/SELECT/INSERT/SELECT/COMMIT), 0.6–1.2 s | 1 query, 150–370 ms |
| `DELETE /habits/:id/complete` as one raw SQL statement (`owned` CTE + data-modifying `deleted` CTE) | 2 queries (`findFirst` + `deleteMany`) | 1 query, 140–290 ms |
| `PATCH /habits/:id` as `update({ where: { id, userId } })`, P2025 → 404 | 2 queries (`findFirst` + `update`) | 1 query, 200–520 ms. `updateManyAndReturn` was tried first and measured at 3 (BEGIN/UPDATE/COMMIT) |
| `DELETE /habits/:id` as `deleteMany({ where: { id, userId } })`, `count === 0` → 404 | 2 queries | 1 query, 120–290 ms |
| Gemini `thinkingLevel: MINIMAL` (`GEMINI_THINKING_LEVEL`) | `generateContent` 8–9.4 s, ~1450 thought tokens | 3.2 s, 0 thought tokens; `POST /ai/habit-suggestions` 11.75 s → 4.6 s |

Note: Prisma compiles an `upsert` whose `update` is empty into an interactive transaction rather than a native `INSERT … ON CONFLICT`. Avoid it on hot paths.

## The remaining factor is distance

Every number above still contains a 50 ms round trip because the backend runs on a laptop in Turkey while the database is in Frankfurt. Co-locating them takes the round trip to ~1 ms — a 60 ms `GET /habits` becomes roughly 10 ms.

That is larger than every code change on this page combined, and it is a deployment decision rather than a code one. See [deployment.md](deployment.md).
