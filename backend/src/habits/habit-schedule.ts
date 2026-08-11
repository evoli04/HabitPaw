import { HabitFrequency } from '@prisma/client';

/**
 * Which frequencies are due on a given weekday, keyed by `Date#getUTCDay()`
 * (0 = Sunday ... 6 = Saturday).
 *
 * Shared by `HabitsService` (today's list) and `ProgressService` (historical
 * day-by-day stats) so both answer "was this habit due on that day?" the same
 * way. Keeping two copies is how the two screens silently drift apart.
 */
export const FREQUENCIES_BY_WEEKDAY: Record<number, HabitFrequency[]> = {
  0: [HabitFrequency.daily, HabitFrequency.weekends], // Sunday
  1: [HabitFrequency.daily, HabitFrequency.weekdays],
  2: [HabitFrequency.daily, HabitFrequency.weekdays],
  3: [HabitFrequency.daily, HabitFrequency.weekdays],
  4: [HabitFrequency.daily, HabitFrequency.weekdays],
  5: [HabitFrequency.daily, HabitFrequency.weekdays],
  6: [HabitFrequency.daily, HabitFrequency.weekends], // Saturday
};

/** True when a habit with `frequency` is due on `day` (weekday read in UTC). */
export function isScheduledOn(frequency: HabitFrequency, day: Date): boolean {
  return FREQUENCIES_BY_WEEKDAY[day.getUTCDay()].includes(frequency);
}

/**
 * UTC midnight of the given instant — the canonical shape for anything compared
 * against a Prisma `@db.Date` column. Defaults to now.
 */
export function toUtcDateOnly(date: Date = new Date()): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
}

/** `YYYY-MM-DD` — the wire format every date in the progress payload uses. */
export function toIsoDate(day: Date): string {
  return day.toISOString().slice(0, 10);
}

/** `day` shifted by whole days, still at UTC midnight. */
export function addDays(day: Date, amount: number): Date {
  return new Date(
    Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate() + amount),
  );
}

/** UTC midnight on the 1st of `day`'s month. */
export function startOfUtcMonth(day: Date): Date {
  return new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), 1));
}

/** Every UTC-midnight day from `start` to `end`, both inclusive. */
export function eachDay(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) {
    days.push(day);
  }
  return days;
}
