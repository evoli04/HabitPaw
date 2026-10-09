import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { Prisma, PrismaClient } from '@prisma/client';

const perfLogEnabled = process.env.PERF_LOG === 'true';

@Injectable()
export class PrismaService
  extends PrismaClient<Prisma.PrismaClientOptions, 'query'>
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger('PrismaQuery');

  constructor() {
    super(perfLogEnabled ? { log: [{ emit: 'event', level: 'query' }] } : {});

    if (perfLogEnabled) {
      this.$on('query', (event: Prisma.QueryEvent) => {
        this.logger.log(`${event.duration}ms ${event.query}`);
      });
    }
  }

  /**
   * Awaited on purpose: without it Nest finishes booting while the connection
   * is still being established, and the first request pays the setup cost
   * (measured at ~1.1 s against the Frankfurt pooler). Connecting at startup
   * moves that off the first user's request.
   */
  async onModuleInit() {
    const start = Date.now();
    await this.$connect();
    if (perfLogEnabled) {
      this.logger.log(`$connect took ${Date.now() - start}ms`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
