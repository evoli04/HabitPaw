import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { GeminiService } from './gemini.service';
import { HabitsModule } from '../habits/habits.module';

@Module({
  imports: [
    HabitsModule,
    // Throttling is registered here, not globally: only the AI routes hit a paid API.
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          {
            ttl: config.get<number>('AI_THROTTLE_TTL_MS', 3_600_000),
            limit: config.get<number>('AI_THROTTLE_LIMIT', 5),
          },
        ],
      }),
    }),
  ],
  controllers: [AiController],
  providers: [AiService, GeminiService],
  exports: [GeminiService],
})
export class AiModule {}
