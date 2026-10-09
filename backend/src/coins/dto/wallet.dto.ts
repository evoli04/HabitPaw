import { ApiProperty } from '@nestjs/swagger';
import { CoinTransactionType } from '@prisma/client';

/** One row of the coin ledger. */
export class CoinTransactionDto {
  @ApiProperty({ format: 'uuid' })
  id: string;

  @ApiProperty({
    example: 30,
    description: 'Positive for earnings, negative for spending',
  })
  amount: number;

  @ApiProperty({
    enum: CoinTransactionType,
    example: CoinTransactionType.habit_reward,
  })
  type: CoinTransactionType;

  @ApiProperty({
    type: String,
    nullable: true,
    format: 'uuid',
    description:
      'Set on habit_reward rows. Becomes null if the habit is later deleted — the ledger row itself is kept.',
  })
  habitId: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-08-12',
    description: 'YYYY-MM-DD (UTC) the reward was earned for',
  })
  rewardDate: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'bow',
    description: 'Set on purchase rows — the catalog id that was bought',
  })
  shopItemId: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: Date;
}

export class WalletDto {
  @ApiProperty({ example: 90, description: 'Current spendable balance' })
  balance: number;

  @ApiProperty({
    example: 30,
    description:
      'Coins one habit completion is worth. Read this instead of hardcoding it client-side.',
  })
  habitReward: number;

  @ApiProperty({
    type: [CoinTransactionDto],
    description: 'Most recent ledger rows, newest first',
  })
  recentTransactions: CoinTransactionDto[];
}
