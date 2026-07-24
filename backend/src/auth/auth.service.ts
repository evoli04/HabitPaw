import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async ensureProfile(userId: string, name?: string) {
    return this.prisma.profile.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, name },
    });
  }
}
