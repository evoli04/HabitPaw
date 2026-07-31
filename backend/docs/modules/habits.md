# Module: habits

`src/habits/` — the only fully-implemented feature module. CRUD for habits plus daily completion tracking. All routes require auth (no `@Public()` routes here) and every query is scoped by `userId`.

## Files

| File | Role |
|---|---|
| `habits.module.ts` | declares `HabitsController`, provides/exports `HabitsService`. Relies on the global `PrismaModule` — no explicit import needed. |
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
| `POST` | `/habits/:id/complete` | `complete` | idempotent upsert of today's completion |
| `DELETE` | `/habits/:id/complete` | `uncomplete` | 204, removes today's completion if present |

## Implementation notes

- **Ownership pattern**: `findOneOrThrow(userId, id)` does `findFirst({ id, userId })` and throws `NotFoundException` if it doesn't match — used by `update`/`remove`/`complete`/`uncomplete`/`findOne` before mutating, so a user can never read or touch another user's habit (a wrong id just looks like a 404, not a 403).
- **`reminderTime` storage**: DTO takes an `HH:mm` string; `toTimeDate()` converts it to `Date` (`1970-01-01T${value}:00.000Z`) to match Prisma's `@db.Time()` column type.
- **"Today" is computed in UTC**, not the caller's local time zone. `todayDateOnly()` builds a UTC-midnight `Date`, and `getTodayForUser` picks applicable frequencies via `getUTCDay()`. A user far from UTC can see "today" flip at the wrong local moment — flagged as a known limitation, not yet addressed.
- **Completion uniqueness**: `HabitCompletion` has a `[habitId, completionDate]` unique constraint; `complete()` upserts on that key (safe to call twice), `uncomplete()` deletes matching rows for today.
- **`getTodayForUser`**: filters active habits whose `frequency` matches today's weekday (`daily` always; `weekdays` Mon–Fri; `weekends` Sat/Sun), includes today's completion row, and maps to a response shape with a computed `completedToday: boolean`.
