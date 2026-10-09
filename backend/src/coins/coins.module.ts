import { Module } from '@nestjs/common';
import { CoinsController } from './coins.controller';
import { CoinsService } from './coins.service';

/**
 * Exports `CoinsService` because both `HabitsModule` (claiming rewards) and
 * `ShopModule` (spending) need it. Dependencies point one way — into coins —
 * so there is no cycle.
 */
@Module({
  controllers: [CoinsController],
  providers: [CoinsService],
  exports: [CoinsService],
})
export class CoinsModule {}
