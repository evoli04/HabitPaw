import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import { envValidationSchema } from './config/env.validation';
import { HealthController } from './common/health/health.controller';
import { HabitsModule } from './habits/habits.module';
import { AiModule } from './ai/ai.module';
import { ProgressModule } from './progress/progress.module';
import { CoinsModule } from './coins/coins.module';
import { ShopModule } from './shop/shop.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    HabitsModule,
    AiModule,
    ProgressModule,
    CoinsModule,
    ShopModule,
    ConfigModule.forRoot({
      validationSchema: envValidationSchema,
      isGlobal: true,
    }),
  ],
  controllers: [AppController, HealthController],
  providers: [AppService],
})
export class AppModule {}
