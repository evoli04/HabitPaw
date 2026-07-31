# Module: config

`src/config/env.validation.ts` — the only "config module" in this codebase. No `configuration.ts` factory or namespaced config object; just a Joi schema passed to `ConfigModule.forRoot()` in `app.module.ts`:

```ts
ConfigModule.forRoot({ validationSchema: envValidationSchema, isGlobal: true })
```

Startup fails fast with a validation error if a required var is missing/malformed.

## Schema (`envValidationSchema`)

| Var | Joi rule |
|---|---|
| `NODE_ENV` | `string().valid('production','development','test').required()` |
| `PORT` | `number().default(3000)` |
| `DATABASE_URL` | `string().required()` |
| `DIRECT_URL` | `string().required()` |
| `SUPABASE_URL` | `string().required()` |
| `SUPABASE_JWKS_URL` | `string().required()` |
| `SUPABASE_PUBLISHABLE_KEY` | `string().required()` |
| `GEMINI_API_KEY` | `string().required()` |
| `GEMINI_MODEL` | `string().required()` |
| `AI_THROTTLE_LIMIT` | `number().default(5)` |
| `AI_THROTTLE_TTL_MS` | `number().default(3600000)` |
| `CORS_ORIGIN` | `string().default('*')` |
| `SWAGGER_ENABLED` | `bool().default(true)` |

Full purpose/usage of each var: [../../Architecture.md#env-vars](../../Architecture.md#env-vars).

## Access pattern (inconsistent — noted, not yet fixed)

Most code injects `ConfigService` and calls `.get<T>('VAR_NAME')` (e.g. `main.ts` for `SWAGGER_ENABLED`, `AuthService.login` for `SUPABASE_URL`/`SUPABASE_PUBLISHABLE_KEY`). Two spots read raw `process.env` instead: `jwt.strategy.ts` (`SUPABASE_JWKS_URL`) and `main.ts`'s `app.listen(process.env.PORT ?? 3000)`. Functionally equivalent since Joi validates/defaults everything at boot either way, but worth normalizing to `ConfigService` everywhere eventually.
