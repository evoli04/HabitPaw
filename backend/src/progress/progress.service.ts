import { Injectable } from '@nestjs/common';
import { HabitFrequency } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  addDays,
  eachDay,
  isScheduledOn,
  startOfUtcMonth,
  startOfUtcWeek,
  toIsoDate,
  toUtcDateOnly,
} from '../habits/habit-schedule';
import { ProgressRange } from './dto/progress-query.dto';
import {
  ProgressHabitDto,
  ProgressPointDto,
  ProgressResponseDto,
} from './dto/progress-response.dto';

/**
 * How far back streaks are allowed to reach. Deliberately larger than any chart
 * range: a 30-day streak must still be reportable while the user is looking at
 * the current-week view.
 */
const STREAK_LOOKBACK_DAYS = 365;

interface DayStats {
  scheduled: number;
  completed: number;
}

/** A habit reduced to exactly what the day-by-day maths needs. */
interface TrackedHabit {
  id: string;
  title: string;
  frequency: HabitFrequency;
  /** UTC-midnight day the habit was created; earlier days do not count against it. */
  bornOn: Date;
  /** `YYYY-MM-DD` keys this habit was completed on, within the queried window. */
  completedOn: Set<string>;
}

function percentOf(completed: number, scheduled: number): number {
  return scheduled === 0 ? 0 : Math.round((completed / scheduled) * 100);
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async getProgress(
    userId: string,
    range: ProgressRange,
  ): Promise<ProgressResponseDto> {
    const today = toUtcDateOnly();
    const rangeStart =
      range === ProgressRange.month
        ? startOfUtcMonth(today)
        : startOfUtcWeek(today);

    const streakStart = addDays(today, -(STREAK_LOOKBACK_DAYS - 1));
    const queryFrom = rangeStart < streakStart ? rangeStart : streakStart;

    // Two queries, no per-day round trips: pull the habits once and every
    // completion in the window once, then do the maths in memory.
    const [habits, completions] = await Promise.all([
      this.prisma.habit.findMany({
        where: { userId, isActive: true },
        select: { id: true, title: true, frequency: true, createdAt: true },
      }),
      this.prisma.habitCompletion.findMany({
        where: { userId, completionDate: { gte: queryFrom, lte: today } },
        select: { habitId: true, completionDate: true },
      }),
    ]);

    const completedDays = new Map<string, Set<string>>();
    for (const completion of completions) {
      const key = toIsoDate(completion.completionDate);
      const days = completedDays.get(completion.habitId);
      if (days) days.add(key);
      else completedDays.set(completion.habitId, new Set([key]));
    }

    const tracked: TrackedHabit[] = habits.map((habit) => ({
      id: habit.id,
      title: habit.title,
      frequency: habit.frequency,
      bornOn: toUtcDateOnly(habit.createdAt),
      completedOn: completedDays.get(habit.id) ?? new Set<string>(),
    }));

    const rangeDays = eachDay(rangeStart, today);
    const points: ProgressPointDto[] = rangeDays.map((day) => {
      const { scheduled, completed } = dayStats(tracked, day);
      return {
        date: toIsoDate(day),
        weekday: day.getUTCDay(),
        scheduled,
        completed,
        percent: percentOf(completed, scheduled),
      };
    });

    const scheduled = points.reduce((sum, point) => sum + point.scheduled, 0);
    const completed = points.reduce((sum, point) => sum + point.completed, 0);
    const streaks = computeStreaks(tracked, streakStart, today);

    return {
      range,
      startDate: toIsoDate(rangeStart),
      endDate: toIsoDate(today),
      timeZone: 'UTC',
      summary: {
        scheduled,
        completed,
        percent: percentOf(completed, scheduled),
        activeHabits: tracked.length,
        perfectDays: points.filter(
          (point) => point.scheduled > 0 && point.completed === point.scheduled,
        ).length,
        currentStreak: streaks.current,
        longestStreak: streaks.longest,
        bestDay: pickBestDay(points),
      },
      points,
      habits: buildHabitBreakdown(tracked, rangeDays),
    };
  }
}

/** How many habits were due on `day`, and how many of those were completed. */
function dayStats(habits: TrackedHabit[], day: Date): DayStats {
  const key = toIsoDate(day);
  let scheduled = 0;
  let completed = 0;

  for (const habit of habits) {
    // A habit created last Tuesday was not "missed" the Monday before it.
    if (habit.bornOn > day) continue;
    if (!isScheduledOn(habit.frequency, day)) continue;
    scheduled += 1;
    if (habit.completedOn.has(key)) completed += 1;
  }

  return { scheduled, completed };
}

type DayStatus = 'hit' | 'miss' | 'skip';

/** `skip` = nothing was due that day, so it neither extends nor breaks a streak. */
function statusOf({ scheduled, completed }: DayStats): DayStatus {
  if (scheduled === 0) return 'skip';
  return completed === scheduled ? 'hit' : 'miss';
}

function computeStreaks(
  habits: TrackedHabit[],
  start: Date,
  end: Date,
): { current: number; longest: number } {
  const statuses = eachDay(start, end).map((day) =>
    statusOf(dayStats(habits, day)),
  );

  let longest = 0;
  let run = 0;
  for (const status of statuses) {
    if (status === 'hit') {
      run += 1;
      if (run > longest) longest = run;
    } else if (status === 'miss') {
      run = 0;
    }
  }

  // Today is usually still in progress. Treating an unfinished today as a break
  // would show every user a 0 streak until they close out the day.
  let index = statuses.length - 1;
  if (index >= 0 && statuses[index] === 'miss') index -= 1;

  let current = 0;
  for (; index >= 0; index -= 1) {
    const status = statuses[index];
    if (status === 'hit') current += 1;
    else if (status === 'miss') break;
  }

  return { current, longest };
}

/**
 * Highest percent wins; ties go to more completions, then to the more recent day.
 * Days with nothing completed are never eligible — surfacing a 0% day as the
 * user's "best day" reads as a bug on the screen.
 */
function pickBestDay(points: ProgressPointDto[]): string | null {
  let best: ProgressPointDto | null = null;

  for (const point of points) {
    if (point.completed === 0) continue;
    if (
      !best ||
      point.percent > best.percent ||
      (point.percent === best.percent && point.completed >= best.completed)
    ) {
      best = point;
    }
  }

  return best?.date ?? null;
}

function buildHabitBreakdown(
  habits: TrackedHabit[],
  rangeDays: Date[],
): ProgressHabitDto[] {
  return habits
    .map((habit) => {
      let scheduled = 0;
      let completed = 0;

      for (const day of rangeDays) {
        if (habit.bornOn > day) continue;
        if (!isScheduledOn(habit.frequency, day)) continue;
        scheduled += 1;
        if (habit.completedOn.has(toIsoDate(day))) completed += 1;
      }

      return {
        habitId: habit.id,
        title: habit.title,
        frequency: habit.frequency,
        scheduled,
        completed,
        percent: percentOf(completed, scheduled),
      };
    })
    .sort(
      (a, b) => b.percent - a.percent || a.title.localeCompare(b.title, 'tr'),
    );
}
