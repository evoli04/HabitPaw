# Module: coins

`src/coins/` — the coin balance and its ledger. Owns nothing about *why* a reward is deserved; callers prove that first and then ask for the payout.

Backs the coin economy that shipped client-side in `mobile/src/contexts/CoinContext.js`, where the balance lived in `AsyncStorage` and was therefore lost on reinstall and writable by the client.

## Files

| File | Role |
|---|---|
| `coins.module.ts` | provides **and exports** `CoinsService` — `HabitsModule` and `ShopModule` both consume it |
| `coins.service.ts` | `getWallet`, `awardHabitReward`, `spend`, `getBalance` |
| `coins.controller.ts` | `GET /coins` |
| `coins.constants.ts` | `HABIT_REWARD = 30`, `RECENT_TRANSACTION_LIMIT = 20` |
| `dto/wallet.dto.ts` | `WalletDto`, `CoinTransactionDto` |
| `dto/claim-reward.dto.ts` | `ClaimRewardResponseDto` — also used by the habits controller |

Dependencies point one way: `habits → coins`, `shop → coins`. No cycle.

## Routes

| Method | Path | Notes |
|---|---|---|
| `GET` | `/coins` | balance, `habitReward`, last 20 ledger rows |

The reward payout route lives in the habits module — `POST /habits/:id/claim-reward` — because the client's mental model is habit-centric. See [habits.md](habits.md).

## The balance/ledger relationship

`profiles.coin_balance` is a **running total**; `coin_transactions` is the **append-only justification**. The ledger is the source of truth and the balance is a cache of it, so both are always written inside one `$transaction` and can never drift.

Ledger rows carry either habit context or purchase context, never both:

| `type` | `amount` | `habit_id` + `reward_date` | `shop_item_id` |
|---|---|---|---|
| `habit_reward` | `+30` | set | null |
| `purchase` | negative | null | set |

A consistency check worth running after schema work:

```sql
select p.id, p.coin_balance, coalesce(sum(t.amount), 0) as ledger_total
from profiles p left join coin_transactions t on t.user_id = p.id
group by p.id, p.coin_balance
having p.coin_balance <> coalesce(sum(t.amount), 0);
```

Empty result = balance and ledger agree.

## Idempotency is the database's job

`awardHabitReward` does **not** read-then-write to check whether the reward was already taken. It inserts and lets the `@@unique([habitId, rewardDate])` constraint reject a duplicate, then translates Prisma's `P2002` into a plain answer:

```ts
return { awarded: 0, balance: await this.getBalance(userId), alreadyClaimed: true };
```

Two consequences worth knowing:

- **Double-tapping the claim button returns 200**, not an error. `alreadyClaimed: true` is information, not a failure — a popup button that errors on the second press is a worse experience than one that quietly agrees.
- **A read-then-write check would have a race window** between the read and the insert. The constraint has none.

`rewardDate` comes from `toUtcDateOnly()` in [`habits/habit-schedule.ts`](../../src/habits/habit-schedule.ts) — the same helper the daily list and the progress chart use, so "today" means one thing across the whole backend.

## Spending is a conditional update, not a check

`spend()` takes a `Prisma.TransactionClient` so the caller controls the transaction boundary. The affordability test and the deduction are a single statement:

```ts
const updated = await tx.profile.updateMany({
  where: { id: userId, coinBalance: { gte: amount } },
  data: { coinBalance: { decrement: amount } },
});
if (updated.count === 0) return null;
```

`count === 0` covers both "not enough coins" and "a concurrent request got there first". With a separate `findUnique` + `update` there would be a window where two purchases both pass the check and the balance goes negative.

## Implementation notes

- **`HABIT_REWARD` is returned by `GET /coins`** so the client can render "30 Coin Al" without hardcoding the number. The mobile constant is currently duplicated in `CoinContext.js`; it should read this field instead.
- **`getWallet` tolerates a missing profile** (`?? 0`). In practice `ensureProfile` in [auth.service.ts](../../src/auth/auth.service.ts) upserts the row on every authenticated request, so this is defensive only.
- **`rewardDate` is serialised as `YYYY-MM-DD`**, not a timestamp — it is a `@db.Date` column and a time component would be meaningless.

## Known limitations

- **Delete-and-recreate farming.** A user can delete a habit, create it again, complete it and claim a second reward the same day, because the new habit has a new id and the unique constraint keys on it. The cheap fix if it ever matters is a per-user daily cap; deliberately not implemented.
- **Rewards are not revoked on uncomplete.** Un-checking a habit leaves both the coins and the ledger row in place, so re-completing it cannot pay out twice. This matches what the mobile app already did and keeps the balance from ever going negative.
- **UTC day boundary**, inherited from `habits`. A user in UTC+3 can claim "today's" reward again at 03:00 local.
