import { Module } from '@nestjs/common';
import { CoinsModule } from '../coins/coins.module';
import { ShopController } from './shop.controller';
import { ShopService } from './shop.service';

@Module({
  imports: [CoinsModule],
  controllers: [ShopController],
  providers: [ShopService],
})
export class ShopModule {}
