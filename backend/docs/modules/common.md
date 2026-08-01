# Module: common

`src/common/` — cross-cutting decorators, shared interfaces, and the health check. Not a NestJS `Module` itself; its pieces are imported directly by other modules, and `HealthController` is registered straight on `AppModule`.

## Files

| File | Role |
|---|---|
| `decorators/public.decorator.ts` | `@Public()` — `SetMetadata(IS_PUBLIC_KEY = 'isPublic', true)`. Consumed by `JwtAuthGuard` (see [auth.md](auth.md)) to exempt a route/controller from the global auth guard. |
| `decorators/current-user.decorator.ts` | `@CurrentUser()` — param decorator, returns `request.user` typed as `AuthenticatedUser`. Only valid on authenticated routes (i.e. not combined with `@Public()`), since `request.user` is set by the JWT strategy. |
| `interfaces/authenticated-user.interface.ts` | `AuthenticatedUser { id: string; email: string }` — shape of `request.user` after successful JWT validation. `id` is the Supabase `auth.users` id / `Profile.id`. |
| `health/health.controller.ts` | `GET /api/health` → `{ status: 'ok' }`, `@Public()`, `@ApiTags('health')`. Registered directly in `AppModule.controllers` (no separate `HealthModule`). Used for uptime checks / load balancer probes. |

## Usage pattern

A protected controller looks like:

```ts
@Get()
findAll(@CurrentUser() user: AuthenticatedUser) {
  return this.service.findAll(user.id);
}
```

A public one adds `@Public()` at the method or class level and omits `@CurrentUser()` (there's no guaranteed `request.user` to read).
