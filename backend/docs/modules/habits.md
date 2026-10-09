# Module: habits

`src/habits/` — the only fully-implemented feature module. CRUD for habits plus daily completion tracking. All routes require auth (no `@Public()` routes here) and every query is scoped by `userId`.

## Files

| File | Role |
|---|---|
| `habits.module.ts` | declares `HabitsController`, provides/exports `HabitsService`. Relies on the global `PrismaModule` — no explicit import needed. Imports `CoinsModule` for reward payouts. |
| `habit-schedule.ts` | shared calendar helpers (`FREQUENCIES_BY_WEEKDAY`, `isScheduledOn`, `toUtcDateOnly`, …) — also used by `ProgressService`, see [progress.md](progress.md) |
| `habits.controller.ts` | routes below. `@ApiTags('habits')`, `@ApiBearerAuth('access-token')`. |
| `habits.service.ts` | business logic, ownership checks, date handling |
| `dto/create-habit.dto.ts` | `title` (≤100, required), `description?` (≤500), `frequency?` (`HabitFrequency`, default `daily`), `reminderTime?` (`HH:mm`, regex-validated) |
| `dto/update-habit.dto.ts` | `PartialType(CreateHabitDto)` from `@nestjs/swagger` — same fields, all optional, Swagger schema stays in sync with validators |

## Routes

Base path `/api/habits`. All require `Authorization: Bearer <token>`.

| Method | Path | Handler | Notes |
|---|---|---|---|
| `GET` | `/habits` | `findAll` | list, ordered `createdAt desc` |
| `POST` | `/habits` | `create` | body: `CreateHabitDto` |
| `GET` | `/habits/today` | `getToday` | declared before `:id` so it isn't swallowed by the param route |
| `GET` | `/habits/:id` | `findOne` | 404 if missing or not owned by caller |
| `PATCH` | `/habits/:id` | `update` | body: `UpdateHabitDto` |
| `DELETE` | `/habits/:id` | `remove` | 204 |
| `POST` | `/habits/:id/complete` | `complete` | idempotent insert of today's completion (one raw SQL statement) |
| `DELETE` | `/habits/:id/complete` | `uncomplete` | 204, removes today's completion if present |
| `POST` | `/habits/:id/claim-reward` | `claimReward` | 200, pays today's coins once. See [coins.md](coins.md) |

## Implementation notes

- **Ownership pattern**: every query is scoped by `userId`, so a user can never read or touch another user's habit (a wrong id just looks like a 404, not a 403). `findOne` uses `findOneOrThrow(userId, id)` (`findFirst({ id, userId })`). Writes carry the check in the write itself, one round trip each: `update` is `update({ where: { id, userId } })` with Prisma's P2025 mapped to 404 (not `updateManyAndReturn`, which Prisma wraps in BEGIN/COMMIT); `remove` is `deleteMany({ where: { id, userId } })` with `count === 0` → 404; `complete`/`uncomplete` are raw SQL with an `owned` CTE.
- **`reminderTime` storage**: DTO takes an `HH:mm` string; `toTimeDate()` converts it to `Date` (`1970-01-01T${value}:00.000Z`) to match Prisma's `@db.Time()` column type.
- **"Today" is computed in UTC**, not the caller's local time zone. `todayDateOnly()` builds a UTC-midnight `Date`, and `getTodayForUser` picks applicable frequencies via `getUTCDay()`. A user far from UTC can see "today" flip at the wrong local moment — flagged as a known limitation, not yet addressed.
- **Completion uniqueness**: `HabitCompletion` has a `[habitId, completionDate]` unique constraint; `complete()` inserts with `ON CONFLICT DO NOTHING` on that key and returns the existing row on a repeat call (safe to call twice). Ownership is checked inside the same statement (`owned` CTE), so someone else's habit or an unknown id returns 404 without inserting anything. `uncomplete()` deletes today's row in a data-modifying CTE and returns whether the habit is owned: not owned → 404, owned but not completed today → 204 with nothing to do.
- **`getTodayForUser`**: filters active habits whose `frequency` matches today's weekday (`daily` always; `weekdays` Mon–Fri; `weekends` Sat/Sun), includes today's completion row, and maps to a response shape with a computed `completedToday: boolean`.
- **`claimReward` checks in order**: ownership via `findOneOrThrow` (a wrong id must look like a 404, not reveal that the habit exists), then that a `HabitCompletion` row exists for today (400 if not), then delegates the payout to `CoinsService.awardHabitReward`. The habits module owns "did you earn it"; the coins module owns "how much and has it been paid".
- **Weekday table is no longer local.** `FREQUENCIES_BY_WEEKDAY` moved to `habit-schedule.ts` when the progress module needed the same "was this due that day?" answer. Two copies is how the home screen and the progress chart drift apart.
