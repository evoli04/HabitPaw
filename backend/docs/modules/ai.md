# Module: ai

`src/ai/` — Gemini-backed habit suggestions. The user submits a free-text goal, Gemini returns
structured habit proposals, and the user can turn any of them into real habits.

The AI never writes to `habits` directly: generation and creation are two separate calls, so a
suggestion only becomes a habit when the user accepts it.

## Files

| File | Role |
|---|---|
| `ai.module.ts` | declares `AiController`, provides `AiService` + `GeminiService`, imports `HabitsModule` and registers `ThrottlerModule` |
| `ai.controller.ts` | the two routes below. `@ApiTags('ai')`, `@ApiBearerAuth('access-token')`, `@UseGuards(ThrottlerGuard)` |
| `ai.service.ts` | prompt building, response normalization, persistence, habit creation |
| `gemini.service.ts` | owns the `@google/genai` client + model name; JSON-mode calls and error mapping |
| `dto/suggest-habits.dto.ts` | request: `goal` (≤300, required), `dailyMinutes?` (5–240), `level?` (`beginner`/`intermediate`/`advanced`), `notes?` (≤500) |
| `dto/habit-suggestion.dto.ts` | response shapes (`HabitSuggestionDto`, `SuggestHabitsResponseDto`) — Swagger only, not validated |
| `dto/accept-suggestions.dto.ts` | request: `indexes` (non-empty int array, ≤10 items) |

## Routes

Base path `/api/ai`. Both require `Authorization: Bearer <token>`.

| Method | Path | Handler | Notes |
|---|---|---|---|
| `POST` | `/ai/habit-suggestions` | `suggestHabits` | calls Gemini, stores an `AiRecommendation`, returns `{ recommendationId, model, suggestions[] }` |
| `POST` | `/ai/habit-suggestions/:id/accept` | `acceptSuggestions` | body `{ indexes: [0,2] }` → creates those habits via `HabitsService.create`, returns the created rows |

Typical flow from a client:

```
POST /api/ai/habit-suggestions   { "goal": "Daha üretken olmak istiyorum", "dailyMinutes": 20 }
  → { "recommendationId": "7df3…", "model": "gemini-3.5-flash", "suggestions": [ {...}, {...}, {...} ] }
POST /api/ai/habit-suggestions/7df3…/accept   { "indexes": [0] }
  → [ { "id": "f8d1…", "title": "Sabah Erken Kalkmak", "frequency": "daily", … } ]
```

## Implementation notes

- **SDK**: `@google/genai` (the current Google GenAI SDK). The previously listed
  `@google/generative-ai` is the deprecated predecessor and has been removed from `package.json`.
- **`vertexai: false`** is passed when constructing the client so the SDK always targets the AI
  Studio endpoint, never Vertex AI, regardless of ambient Google Cloud env vars.
- **Structured output**: `GeminiService.generateJson()` sends `responseMimeType: 'application/json'`
  plus a `responseSchema`, so the model returns schema-shaped JSON instead of prose. A defensive
  ``` fence strip runs before `JSON.parse` anyway.
- **Model output is never trusted**: `normalizeSuggestion()` drops entries missing
  `title`/`description`/`reason`, truncates to the DB column limits (`VarChar(100)` / `VarChar(500)`),
  falls back to `frequency: daily` for unknown values, and discards a `reminderTime` that isn't
  `HH:mm`. If nothing survives, the request 400s.
- **Existing habits are part of the prompt** (up to 20 active titles) so suggestions complement what
  the user already tracks instead of repeating it.
- **Persistence**: every generation writes an `AiRecommendation` row (`goal`, `requestContext`,
  `suggestions`, `model`) — see [../database.md](../database.md). `accept` reads that row scoped by
  `userId`, so one user cannot accept another user's recommendation (404, like the habits module).
- **Prompt language is Turkish** — the generated `title`/`description`/`reason` reach end users
  directly. Code and docs stay English.
- **Rate limiting**: `ThrottlerModule.forRootAsync` is registered in `AiModule` (not globally) and
  `ThrottlerGuard` is applied to `suggestHabits` **only** — that is the handler that spends Gemini
  quota; `accept` merely writes rows. Limits come from `AI_THROTTLE_LIMIT` (default 5) per
  `AI_THROTTLE_TTL_MS` (default 3600000 ms); exceeding them returns 429 with `Retry-After`.
  Note that guards run before pipes, so a request rejected by validation still consumes a slot.

## Error mapping

`GeminiService.toHttpException()` logs the upstream detail server-side and returns a generic
message to the client — upstream errors can leak quota/project information.

| Upstream | Client sees | Logged as |
|---|---|---|
| 404 (model retired/unknown) | 503 `AI service is not configured correctly` | error, with the "set GEMINI_MODEL" hint |
| 429 (quota) | 429 `AI service is rate limited, try again later` | warn |
| 400/401/403 (bad key or request) | 503 `AI service is not configured correctly` | error |
| anything else / empty / non-JSON body | 502 `AI service is unavailable` / `returned malformed output` | error |

## Troubleshooting

**`404 … is no longer available to new users`** — this is what blocked the first integration
attempt. Google retires model ids for *new* API keys while keeping them listed in `ListModels`, so
a model that appears available still 404s on `generateContent`. Symptoms: every call fails with
that message even though the key is valid.

Fix: set `GEMINI_MODEL` to a model the key can actually call. Known state for this project's key
(checked 2026-08-04):

| Model | Result |
|---|---|
| `gemini-2.5-flash`, `gemini-2.5-flash-lite` | 404 — retired for new keys |
| `gemini-2.0-flash` | 429 — no free-tier quota |
| `gemini-3.5-flash`, `gemini-3.5-flash-lite`, `gemini-3-flash-preview`, `gemini-flash-latest` | works |

Current setting: `GEMINI_MODEL=gemini-3.5-flash`.

`GEMINI_THINKING_LEVEL` (default `MINIMAL`; `LOW`/`MEDIUM`/`HIGH`, or empty for the model default) is sent as `thinkingConfig.thinkingLevel`. Measured 2026-10-08 on `gemini-3.5-flash` with the suggestion prompt: default thinking ~8–9 s and ~1450 thought tokens; `MINIMAL` ~3–5 s, 0 thought tokens, same number of suggestions; `LOW` ~6 s. `gemini-3.5-flash-lite` was slower (9–13 s) and returned fewer suggestions. If a future `GEMINI_MODEL` rejects `thinkingLevel` with a 400, set the variable to an empty string.

To re-check which models a key can call, list them and then actually call one — listing alone
proves nothing:

```bash
curl "https://generativelanguage.googleapis.com/v1beta/models?key=$GEMINI_API_KEY"
npm run check:gemini   # from the repo root — one-shot generateContent against GEMINI_MODEL
```

**`GEMINI_API_KEY: MISSING`** in the root prototype scripts — those scripts load `.env` from the
repo root and fall back to `backend/.env`. If neither exists the key is `undefined` and the SDK
fails with a 400. Copy `.env.example` or rely on `backend/.env`.

## Related

- [habits.md](habits.md) — `HabitsService.create` is what `accept` calls
- [../database.md](../database.md) — `AiRecommendation` model
- Root prototype scripts (`petStatusMotor.js`, `test.js`, `testgemini.js`) predate this module and
  are not wired into the backend; they share the same model/env pitfalls documented above.
