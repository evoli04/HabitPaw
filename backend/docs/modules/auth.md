# Module: auth

`src/auth/` — verifies Supabase-issued JWTs; provisions local `Profile` rows on first sight of a user; exposes one dev-convenience login endpoint. No production register/login endpoints — see [../../Architecture.md#auth-flow](../../Architecture.md#auth-flow).

## Files

| File | Role |
|---|---|
| `auth.module.ts` | registers `PassportModule`, `AuthController`, `AuthService`, `JwtStrategy`; registers `JwtAuthGuard` as the **global** guard (`APP_GUARD`) — every route requires auth unless `@Public()` |
| `auth.service.ts` | `login(dto)` — proxies Supabase password-grant auth |
| `auth.controller.ts` | `POST /api/auth/login` (`@Public()`) — dev/testing only |
| `strategies/jwt.strategy.ts` | Passport strategy: verifies bearer JWT via Supabase JWKS (ES256), returns `AuthenticatedUser` — no database access |
| `guards/jwt-auth.guard.ts` | extends `AuthGuard('jwt')`; short-circuits to allow when `@Public()` metadata is present on the handler or class |
| `dto/login.dto.ts` | `{ email, password }` request body for the dev login endpoint. `password` is only checked non-empty — it previously required 6+ chars, which 400'd accounts that Supabase itself accepts (password policy belongs to signup, which Supabase owns). |
| `dto/login-response.dto.ts` | typed Supabase token response shape (`access_token`, `refresh_token`, `expires_in`, `token_type`, `user`) |

## `JwtStrategy` details

- Extracts bearer token from `Authorization` header (`ExtractJwt.fromAuthHeaderAsBearerToken()`).
- `algorithms: ['ES256']` — Supabase's default asymmetric signing algorithm.
- Signing key resolved via a `jwks-rsa` `JwksClient` owned by the strategy against `SUPABASE_JWKS_URL` (read from raw `process.env`, not `ConfigService` — see [Architecture.md known gaps](../../Architecture.md#known-gaps)), cached, rate-limited to 5 req/min. The strategy builds the client itself rather than using `passportJwtSecret` so `onModuleInit` can fetch the keys at startup; otherwise the first authenticated request paid the JWKS fetch (~600 ms). A failed warm-up only logs a warning. The secret provider mirrors `passportJwtSecret`: unparsable token or unknown `kid` → no key → 401.
- **Does not check `iss`/`aud` claims** — signature validity against the project's JWKS is the only check.
- `validate(payload)` reads `sub` (Supabase user id) and `email`; returns `{ id: sub, email }`, which Passport attaches to `request.user`. It does not touch the database: the `profiles` row is created by the `on_auth_user_created` trigger when Supabase Auth inserts the user (see [database.md](../database.md)).

## `AuthService.login()` (dev endpoint backing)

Calls `POST {SUPABASE_URL}/auth/v1/token?grant_type=password` with `apikey: SUPABASE_PUBLISHABLE_KEY` and the email/password body. On a non-2xx response throws `UnauthorizedException('Invalid Supabase credentials')`; on success returns the token payload typed as `LoginResponseDto`. Used only by `POST /api/auth/login` — **not** part of the token-verification path used by every other request.

## Routes

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/login` | `@Public()` | dev/testing convenience — get a token to paste into Swagger's Authorize dialog. Real clients should use the Supabase SDK directly. |

## Related decorators/interfaces (in `common`, not `auth`)

- `@Public()` — `src/common/decorators/public.decorator.ts`, sets `isPublic` metadata consumed by `JwtAuthGuard`.
- `@CurrentUser()` — `src/common/decorators/current-user.decorator.ts`, reads `request.user`.
- `AuthenticatedUser` — `src/common/interfaces/authenticated-user.interface.ts`, `{ id: string; email: string }`.

See [common.md](common.md) for full detail on these.
