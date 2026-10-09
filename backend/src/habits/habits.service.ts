import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HabitCompletion, Prisma } from '@prisma/client';
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

  /**
   * Ownership is part of the `where`, so this is one `UPDATE … RETURNING`
   * instead of `findOneOrThrow` + `update`. No matching row (unknown id or
   * someone else's habit) makes Prisma throw P2025, mapped to a 404.
   *
   * Not `updateManyAndReturn`: Prisma wraps that in BEGIN/COMMIT, three
   * round trips instead of one.
   */
  async update(userId: string, id: string, dto: UpdateHabitDto) {
    try {
      return await this.prisma.habit.update({
        where: { id, userId },
        data: {
          title: dto.title,
          description: dto.description,
          frequency: dto.frequency,
          reminderTime: toTimeDate(dto.reminderTime),
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Habit not found');
      }
      throw error;
    }
  }

  /** Same pattern as `update`: one `DELETE … WHERE id AND user_id`. */
  async remove(userId: string, id: string) {
    const { count } = await this.prisma.habit.deleteMany({
      where: { id, userId },
    });
    if (count === 0) throw new NotFoundException('Habit not found');
  }

  /**
   * Marks the habit done for today. Idempotent: a second call returns the
   * existing completion.
   *
   * One statement, one round trip. The previous `findOneOrThrow` + `upsert`
   * cost six — Prisma runs an `upsert` with an empty `update` as
   * BEGIN / SELECT / INSERT / SELECT / COMMIT.
   *
   * - `owned` carries the ownership check: for someone else's habit (or an
   *   unknown id) it is empty, nothing is inserted and the result is a 404.
   * - `inserted` is empty when today's row already exists (ON CONFLICT).
   *   All CTEs see the same snapshot, so the final `UNION ALL` branch finds
   *   that pre-existing row but can never see the one inserted here — exactly
   *   one row comes back either way.
   */
  async complete(userId: string, id: string): Promise<HabitCompletion> {
    const completionDate = todayDateOnly();
    const rows = await this.prisma.$queryRaw<HabitCompletion[]>`
      with owned as (
        select id from habits where id = ${id}::uuid and user_id = ${userId}::uuid
      ),
      inserted as (
        insert into habit_completions (id, habit_id, user_id, completion_date)
        select gen_random_uuid(), owned.id, ${userId}::uuid, ${completionDate}::date
          from owned
        on conflict (habit_id, completion_date) do nothing
        returning id, habit_id, user_id, completion_date, created_at
      )
      select id, habit_id as "habitId", user_id as "userId",
             completion_date as "completionDate", created_at as "createdAt"
        from inserted
      union all
      select hc.id, hc.habit_id, hc.user_id, hc.completion_date, hc.created_at
        from habit_completions hc
        join owned on owned.id = hc.habit_id
       where hc.completion_date = ${completionDate}::date
    `;
    if (rows.length === 0) throw new NotFoundException('Habit not found');
    return rows[0];
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

  /**
   * Removes today's completion. One statement, like `complete`.
   *
   * A plain `deleteMany` cannot tell "not your habit" (404) from "owned but
   * not completed today" (204, nothing to do), so ownership comes back from
   * the `owned` CTE. A data-modifying CTE always runs to completion, even
   * though the outer query never reads `deleted`.
   */
  async uncomplete(userId: string, id: string) {
    const completionDate = todayDateOnly();
    const [{ owned }] = await this.prisma.$queryRaw<{ owned: boolean }[]>`
      with owned as (
        select id from habits where id = ${id}::uuid and user_id = ${userId}::uuid
      ),
      deleted as (
        delete from habit_completions hc
         using owned
         where hc.habit_id = owned.id
           and hc.completion_date = ${completionDate}::date
        returning hc.id
      )
      select exists (select 1 from owned) as owned
    `;
    if (!owned) throw new NotFoundException('Habit not found');
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
