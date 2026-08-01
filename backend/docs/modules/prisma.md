# Module: prisma

`src/prisma/` — wraps `PrismaClient` as an injectable, globally-available NestJS provider.

## Files

| File | Role |
|---|---|
| `prisma.module.ts` | `@Global()` module, provides/exports `PrismaService` — any module can inject it without importing `PrismaModule` |
| `prisma.service.ts` | `PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy` |

## Lifecycle

```ts
async onModuleInit() { this.$connect(); }
async onModuleDestroy() { this.$disconnect(); }
```

Both calls are **not awaited** despite the methods being `async` — a known gap (see [../../Architecture.md#known-gaps](../../Architecture.md#known-gaps)). ESLint's `no-floating-promises` is set to `warn` in this repo, not `error`, so this doesn't fail lint/CI.

## Schema

Full model reference: [../database.md](../database.md).

Two connection strings are used (see `Architecture.md` env var table): `DATABASE_URL` (pooled, transaction mode, runtime) and `DIRECT_URL` (session mode, used by `prisma migrate`).
