import { Injectable } from '@nestjs/common';
import { CoinTransactionType, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toIsoDate, toUtcDateOnly } from '../habits/habit-schedule';
import { HABIT_REWARD, RECENT_TRANSACTION_LIMIT } from './coins.constants';
import { ClaimRewardResponseDto } from './dto/claim-reward.dto';
import { WalletDto } from './dto/wallet.dto';

/** Prisma's unique-constraint violation. */
function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

/**
 * Owns the coin balance and its ledger. `profiles.coin_balance` is a running
 * total; `coin_transactions` is the append-only justification for it. Both are
 * always written inside the same transaction so they cannot drift.
 */
@Injectable()
export class CoinsService {
  constructor(private readonly prisma: PrismaService) {}

  async getWallet(userId: string): Promise<WalletDto> {
    // Balance and ledger in one request instead of two parallel ones.
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: {
        coinBalance: true,
        coinTransactions: {
          orderBy: { createdAt: 'desc' },
          take: RECENT_TRANSACTION_LIMIT,
          select: {
            id: true,
            amount: true,
            type: true,
            habitId: true,
            rewardDate: true,
            shopItemId: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      balance: profile?.coinBalance ?? 0,
      habitReward: HABIT_REWARD,
      recentTransactions: (profile?.coinTransactions ?? []).map((transaction) => ({
        ...transaction,
        rewardDate: transaction.rewardDate
          ? toIsoDate(transaction.rewardDate)
          : null,
      })),
    };
  }

  /**
   * Grants today's reward for a habit. Caller is responsible for ownership and
   * for checking the habit is actually completed — see `HabitsService.claimReward`.
   *
   * Idempotency is the database's job, not a read-then-write check: the
   * `[habitId, rewardDate]` unique constraint rejects a second insert, and that
   * rejection is translated into a plain "already claimed" answer.
   */
  async awardHabitReward(
    userId: string,
    habitId: string,
  ): Promise<ClaimRewardResponseDto> {
    const rewardDate = toUtcDateOnly();

    try {
      // Array-form `$transaction`: still one atomic unit, but sent as a single
      // batch. The interactive form would spend a round trip each on BEGIN, the
      // insert, the update and COMMIT — four times ~260 ms on a remote database.
      const [, profile] = await this.prisma.$transaction([
        this.prisma.coinTransaction.create({
          data: {
            userId,
            amount: HABIT_REWARD,
            type: CoinTransactionType.habit_reward,
            habitId,
            rewardDate,
          },
        }),
        this.prisma.profile.update({
          where: { id: userId },
          data: { coinBalance: { increment: HABIT_REWARD } },
          select: { coinBalance: true },
        }),
      ]);

      return {
        awarded: HABIT_REWARD,
        balance: profile.coinBalance,
        alreadyClaimed: false,
      };
    } catch (error) {
      if (!isUniqueViolation(error)) throw error;
      return {
        awarded: 0,
        balance: await this.getBalance(userId),
        alreadyClaimed: true,
      };
    }
  }

  /**
   * Deducts `amount` inside an existing transaction and records the ledger row.
   * Returns the new balance, or `null` when the user cannot afford it.
   *
   * The affordability check and the decrement are a single conditional update:
   * two concurrent purchases can therefore never both pass the check and drive
   * the balance negative. A read-then-write would leave exactly that gap.
   */
  async spend(
    tx: Prisma.TransactionClient,
    userId: string,
    amount: number,
    shopItemId: string,
  ): Promise<number | null> {
    // Raw SQL because `updateMany` cannot return rows: `RETURNING` gets the
    // guard and the new balance out of one statement. Previously this took
    // three (updateMany, insert, findUniqueOrThrow).
    const rows = await tx.$queryRaw<{ coin_balance: number }[]>`
      update profiles
         set coin_balance = coin_balance - ${amount}
       where id = ${userId}::uuid
         and coin_balance >= ${amount}
      returning coin_balance
    `;
    if (rows.length === 0) return null;

    await tx.coinTransaction.create({
      data: {
        userId,
        amount: -amount,
        type: CoinTransactionType.purchase,
        shopItemId,
      },
    });

    return rows[0].coin_balance;
  }

  async getBalance(userId: string): Promise<number> {
    const profile = await this.prisma.profile.findUnique({
      where: { id: userId },
      select: { coinBalance: true },
    });
    return profile?.coinBalance ?? 0;
  }
}
