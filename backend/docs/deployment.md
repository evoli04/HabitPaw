# Deployment — where the backend should run

Decision document, not a runbook. Nothing here is implemented yet.

## Why this matters more than the code

The database is in `eu-central-1` (Frankfurt). The backend currently runs on a developer laptop in Turkey, ~50 ms away. Every query carries that round trip, and [performance.md](performance.md) shows it is the dominant remaining cost after the code-level work.

Co-locating the backend with the database takes the round trip from ~50 ms to ~1 ms:

| Endpoint | Local (Turkey) | Expected co-located |
|---|---:|---:|
| `GET /habits` | 60 ms | ~10 ms |
| `GET /habits/today` | 115 ms | ~15 ms |
| `POST /habits/:id/claim-reward` | 339 ms | ~30 ms |

**A second benefit is arguably bigger for day-to-day work.** Right now `EXPO_PUBLIC_API_BASE_URL` points at a LAN address (`http://192.168.1.175:3000/api`), which forces: phone and laptop on the same Wi-Fi, Windows Firewall rules for ports 3000 and 8081, and an `.env` edit plus `expo start --clear` whenever the laptop's IP changes. A deployed backend replaces all of that with one stable HTTPS URL, and lets teammates test without running the backend at all.

## Requirements

1. **Frankfurt / `eu-central-1` region** — the whole point. Verify at signup; region availability differs per platform and per plan.
2. **Always on, or a wake time that is honest about the cost.** A sleeping instance pays the Prisma connection setup again on wake — measured at ~1.1 s, on top of the platform's own cold start.
3. **Environment variables**, including secrets (`SUPABASE_SECRET_KEY`, `GEMINI_API_KEY`). Never baked into an image.
4. **Node 20+**, `npm ci && npx prisma generate && npm run build`, then `node dist/main`.

`npx prisma generate` after `npm ci` is not optional — installing without it leaves a stub client and the build fails with `HabitFrequency` errors. This bit us once already.

## Options

| | Free tier | Idle behaviour | Notes |
|---|---|---|---|
| **Render** | Real free tier, no credit card | Free web services spin down after ~15 min idle; 30–50 s to wake | Simplest path; no Dockerfile or CLI required |
| **Fly.io** | No free tier for new accounts; card required | Machines can be configured to stay running | Best region/placement control; smallest shared-CPU VM under ~$2/month |
| **Railway** | No free tier; ~$1/month credit covers a few hours | Always on while credits last | Best developer experience; typical solo cost $10–15/month |

Figures from platform comparisons current as of 2026 — confirm pricing and region list before committing, these change often.

## Recommendation

**Start on Render's free tier to prove the setup, then move to a paid always-on instance once someone other than you depends on it.**

Reasoning: the free tier is genuinely free and needs no card, which suits a student project; the spin-down is tolerable while the only users are the team; and the migration path off it is short because nothing here is platform-specific — it is a plain Node process reading `DATABASE_URL`.

The spin-down is the one thing to watch. A 30–50 s wake plus ~1.1 s connection setup means the first request after an idle period looks broken from the app's side, where [`apiClient.js`](../../mobile/src/services/apiClient.js) has a 15 s timeout and will surface "Sunucuya ulaşılamadı". If that becomes annoying before there is budget, the cheapest fix is Fly.io's smallest always-on machine rather than a Render paid plan.

Do **not** pick a platform without an `eu-central-1`/Frankfurt option just because its free tier is better. A backend in, say, Virginia would undo the entire Supabase region move.

## Checklist when the time comes

1. Confirm the platform offers Frankfurt on the plan being used
2. Set env vars from `backend/.env.example`, with `DATABASE_URL` on the session pooler (see [performance.md](performance.md#connection-mode-transaction-pooler-vs-session-pooler)) and a `connection_limit` sized to the instance count
3. Build: `npm ci && npx prisma generate && npm run build`; start: `node dist/main`
4. Apply migrations with `npx prisma migrate deploy` — **never** `migrate dev` against a shared database
5. Set `SWAGGER_ENABLED=false` if the URL is public
6. Enable CORS before any browser client exists — `CORS_ORIGIN` is validated but `app.enableCors()` is still never called, see [Known gaps](../Architecture.md#known-gaps)
7. Point `mobile/.env`'s `EXPO_PUBLIC_API_BASE_URL` at the new HTTPS URL, then `npx expo start --clear`
8. Re-measure with the same endpoint benchmark and update [performance.md](performance.md)
