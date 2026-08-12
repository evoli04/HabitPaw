import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CoinsService } from '../coins/coins.service';
import { ClaimRewardResponseDto } from '../coins/dto/claim-reward.dto';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { FREQUENCIES_BY_WEEKDAY, toUtcDateOnly } from './habit-schedule';

function toTimeDate(value?: string): Date | undefined {
  if (!value) return undefined;
  return new Date(`1970-01-01T${value}:00.000Z`);
}

function todayDateOnly(): Date {
  return toUtcDateOnly();
}

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coins: CoinsService,
  ) {}

  create(userId: string, dto: CreateHabitDto) {
    return this.prisma.habit.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        frequency: dto.frequency,
        reminderTime: toTimeDate(dto.reminderTime),
      },
    });
  }

  /**
   * Creates several habits in a single database round trip.
   *
   * Prisma's array-form `$transaction` sends the statements as one batch. A
   * `for` loop of awaited `create` calls pays a full round trip each — ~260 ms
   * against the Frankfurt pooler, so three suggestions cost nearly a second.
   * `createMany` would batch too, but it does not return the created rows and
   * callers need them.
   */
  createMany(userId: string, dtos: CreateHabitDto[]) {
    return this.prisma.$transaction(
      dtos.map((dto) =>
        this.prisma.habit.create({
          data: {
            userId,
            title: dto.title,
            description: dto.description,
            frequency: dto.frequency,
            reminderTime: toTimeDate(dto.reminderTime),
          },
        }),
      ),
    );
  }

  findAll(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOneOrThrow(userId: string, id: string) {
    const habit = await this.prisma.habit.findFirst({ where: { id, userId } });
    if (!habit) throw new NotFoundException('Habit not found');
    return habit;
  }

  async update(userId: string, id: string, dto: UpdateHabitDto) {
    await this.findOneOrThrow(userId, id);
    return this.prisma.habit.update({
      where: { id },
      data: {
        title: dto.title,
        description: dto.description,
        frequency: dto.frequency,
        reminderTime: toTimeDate(dto.reminderTime),
      },
    });
  }

  async remove(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    await this.prisma.habit.delete({ where: { id } });
  }

  async complete(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    const completionDate = todayDateOnly();
    return this.prisma.habitCompletion.upsert({
      where: { habitId_completionDate: { habitId: id, completionDate } },
      update: {},
      create: { habitId: id, userId, completionDate },
    });
  }

  /**
   * Pays out today's coin reward for a habit the caller has already completed.
   *
   * Order matters: ownership first (a wrong id must look like a 404, not leak
   * that the habit exists), then proof of completion, then the payout. Calling
   * it twice is safe — the second call reports `alreadyClaimed` with a 200.
   */
  async claimReward(
    userId: string,
    id: string,
  ): Promise<ClaimRewardResponseDto> {
    // Ownership and proof-of-completion in one query rather than two: the
    // relation filter carries the completion check, so a wrong id and an
    // unfinished habit are still told apart without a second round trip.
    const habit = await this.prisma.habit.findFirst({
      where: { id, userId },
      select: {
        id: true,
        completions: {
          where: { completionDate: todayDateOnly() },
          select: { id: true },
          take: 1,
        },
      },
    });
    if (!habit) throw new NotFoundException('Habit not found');
    if (habit.completions.length === 0) {
      throw new BadRequestException(
        'Ödülü alabilmek için önce alışkanlığı bugün tamamlamalısın',
      );
    }

    return this.coins.awardHabitReward(userId, id);
  }

  async uncomplete(userId: string, id: string) {
    await this.findOneOrThrow(userId, id);
    const completionDate = todayDateOnly();
    await this.prisma.habitCompletion.deleteMany({
      where: { habitId: id, completionDate },
    });
  }

  async getTodayForUser(userId: string) {
    const applicableFrequencies = FREQUENCIES_BY_WEEKDAY[new Date().getUTCDay()];
    const completionDate = todayDateOnly();

    const habits = await this.prisma.habit.findMany({
      where: { userId, isActive: true, frequency: { in: applicableFrequencies } },
      include: { completions: { where: { completionDate } } },
      orderBy: { createdAt: 'asc' },
    });

    return habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      description: habit.description,
      frequency: habit.frequency,
      reminderTime: habit.reminderTime,
      isActive: habit.isActive,
      createdAt: habit.createdAt,
      completedToday: habit.completions.length > 0,
    }));
  }
}
