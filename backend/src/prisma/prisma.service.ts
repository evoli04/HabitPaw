import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    /**
     * Awaited on purpose: without it Nest finishes booting while the connection
     * is still being established, and the first request pays the setup cost
     * (measured at ~1.1 s against the Frankfurt pooler). Connecting at startup
     * moves that off the first user's request.
     */
    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}
