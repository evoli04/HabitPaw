import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

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
