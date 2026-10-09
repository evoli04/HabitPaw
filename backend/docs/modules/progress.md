# Module: progress

`src/progress/` — read-only reporting over `habits` + `habit_completions`. Feeds the mobile **İlerleme** screen, which until now only re-fetched `GET /habits/today` and computed a single daily percentage client-side.

Writes nothing. Every query is scoped by `userId` taken from the bearer token.

## Files

| File | Role |
|---|---|
| `progress.module.ts` | declares `ProgressController`, provides `ProgressService`. No imports — `PrismaModule` is `@Global()`. |
| `progress.controller.ts` | one route, `@ApiTags('progress')`, `@ApiBearerAuth('access-token')` |
| `progress.service.ts` | the whole calculation: day series, summary, streaks, per-habit breakdown |
| `dto/progress-query.dto.ts` | `ProgressRange` enum + `range?` query param |
| `dto/progress-response.dto.ts` | `ProgressResponseDto` and its three nested shapes |

Shared calendar logic lives in [`src/habits/habit-schedule.ts`](../../src/habits/habit-schedule.ts), imported by both `HabitsService` and `ProgressService` — see [Shared schedule helper](#shared-schedule-helper).

## Route

| Method | Path | Query | Notes |
|---|---|---|---|
| `GET` | `/progress` | `range?=week\|month` | defaults to `week`; any other value is a 400 from the global `ValidationPipe` |

Deliberately mounted at `/api/progress`, not `/api/habits/progress`: the habits controller already has a `:id` param route that swallows unknown sub-paths unless the literal route is declared above it (see [habits.md](habits.md)). A separate base path removes that ordering trap and gives the mobile team its own Swagger section.

## Response shape

```jsonc
{
  "range": "week",
  "startDate": "2026-08-05",     // first day in points
  "endDate": "2026-08-11",       // always today
  "timeZone": "UTC",
  "summary": {
    "scheduled": 18,             // sum over the range
    "completed": 4,
    "percent": 22,               // rounded completed/scheduled × 100
    "activeHabits": 4,           // right now, not range-dependent
    "perfectDays": 1,
    "currentStreak": 0,
    "longestStreak": 1,
    "bestDay": "2026-08-07"      // nullable
  },
  "points": [                    // one per day, oldest first, no gaps
    { "date": "2026-08-05", "weekday": 3, "scheduled": 2, "completed": 0, "percent": 0 }
  ],
  "habits": [                    // sorted by percent desc, then title
    { "habitId": "…", "title": "Drink water", "frequency": "daily",
      "scheduled": 7, "completed": 2, "percent": 29 }
  ]
}
```

## Rules the client should know

- **`week`** = the last 7 days, today inclusive. Fixed width, so the chart never collapses.
- **`month`** = the 1st of the current calendar month through today. On the 1st this is a single point.
- **`points` has no gaps.** Days where nothing was due are present with `scheduled: 0`, so the client never has to synthesise missing dates.
- **A habit only counts from the day it was created.** `scheduled` for 2026-08-05 ignores a habit created on 2026-08-10 — otherwise every new habit would retroactively paint the chart with misses. This is why a brand-new user sees `0/0` days rather than `0/5`.
- **`bestDay` skips zero-completion days.** A user who completed nothing gets `null`, not a 0% "best day".
- **Percentages are integers**, already rounded server-side. `scheduled: 0` yields `percent: 0`.

## Streak semantics

Decided with the product owner, encoded in `computeStreaks`:

- A day is a **hit** when *every* scheduled habit was completed, a **miss** when at least one was not, and a **skip** when nothing was due.
- **Skips never break a streak** and never extend it. A user with weekday-only habits keeps their streak over the weekend.
- **`currentStreak`** walks backwards from today. If today is currently a miss it is stepped over rather than treated as a break — otherwise every user would read 0 until they finished the day. A completed today does count.
- **`longestStreak`** is the longest run of hits inside the lookback window.
- Both look back `STREAK_LOOKBACK_DAYS` (365), **independent of `range`**. A 30-day streak must still be reportable while the user is on the 7-day view.

## Shared schedule helper

`src/habits/habit-schedule.ts` holds the single answer to "was this habit due on that day?":

| Export | Use |
|---|---|
| `FREQUENCIES_BY_WEEKDAY` | weekday (`getUTCDay()`) → applicable `HabitFrequency[]` |
| `isScheduledOn(frequency, day)` | per-day predicate used by the progress maths |
| `toUtcDateOnly(date?)` | UTC midnight — the shape Prisma `@db.Date` columns compare against |
| `toIsoDate(day)` | `YYYY-MM-DD` wire format |
| `addDays`, `startOfUtcMonth`, `eachDay` | range construction |

`HabitsService` was refactored to import `FREQUENCIES_BY_WEEKDAY` and `toUtcDateOnly` from here instead of keeping private copies. Two copies of the weekday table is exactly how "today" on the home screen and "today" on the progress chart drift apart.

## Implementation notes

- **Two queries, no N+1.** All habits and all completions in the window are fetched once (`Promise.all`), then the day-by-day maths runs in memory. Completions are indexed into a `Map<habitId, Set<'YYYY-MM-DD'>>` for O(1) lookups.
- **The query window is `min(rangeStart, streakStart)`**, so the 365-day streak scan and the chart range share a single completions fetch.
- **`isActive: false` habits are excluded entirely**, matching `getTodayForUser`. No code path currently sets `isActive` to false (neither `CreateHabitDto` nor `UpdateHabitDto` exposes it), so today this is a no-op — but if soft-delete is ever added, deactivated habits will also vanish from *historical* days, which is probably not what you want. Revisit then.

## Known limitations

- **Everything is UTC**, inherited from `habits`. A user in UTC+3 sees a day boundary at 03:00 local. `timeZone` is returned in the payload so the client can display it and so making it configurable later is not a breaking change.
- **No caching.** Each request recomputes from the database. Fine at current scale (a year of completions for one user is small); revisit if the range ever grows to "all time".
- **No tests yet.** `dayStats`, `statusOf`, `computeStreaks` and `pickBestDay` are pure functions and are the natural first unit tests — streak edge cases (skip days, unfinished today, habit created mid-range) are easy to get wrong on later edits.
