import { ApiProperty } from '@nestjs/swagger';
import { HabitFrequency } from '@prisma/client';
import { ProgressRange } from './progress-query.dto';

/**
 * One day on the chart's x-axis. Every day in the requested range is present,
 * including days with nothing scheduled (`scheduled: 0`) — the client should not
 * have to fill gaps itself.
 */
export class ProgressPointDto {
  @ApiProperty({ example: '2026-08-11', description: 'YYYY-MM-DD, UTC' })
  date: string;

  @ApiProperty({
    example: 2,
    minimum: 0,
    maximum: 6,
    description: 'Weekday in UTC, 0 = Sunday … 6 = Saturday. For axis labels.',
  })
  weekday: number;

  @ApiProperty({
    example: 3,
    description:
      'Habits due that day: frequency matched the weekday and the habit already existed.',
  })
  scheduled: number;

  @ApiProperty({ example: 2, description: 'How many of them were completed' })
  completed: number;

  @ApiProperty({
    example: 67,
    description: 'Rounded completed/scheduled × 100. 0 when nothing was scheduled.',
  })
  percent: number;
}

/** Per-habit totals across the requested range — for the "which habit is slipping" chart. */
export class ProgressHabitDto {
  @ApiProperty({ format: 'uuid' })
  habitId: string;

  @ApiProperty({ example: 'Su iç' })
  title: string;

  @ApiProperty({ enum: HabitFrequency, example: HabitFrequency.daily })
  frequency: HabitFrequency;

  @ApiProperty({
    example: 7,
    description: 'Days in the range this habit was due and already existed',
  })
  scheduled: number;

  @ApiProperty({ example: 5 })
  completed: number;

  @ApiProperty({ example: 71 })
  percent: number;
}

export class ProgressSummaryDto {
  @ApiProperty({ example: 18, description: 'Sum of every day’s scheduled count' })
  scheduled: number;

  @ApiProperty({ example: 13 })
  completed: number;

  @ApiProperty({
    example: 72,
    description: 'Rounded completed/scheduled × 100 for the whole range',
  })
  percent: number;

  @ApiProperty({
    example: 3,
    description: 'Active habits the user has right now (not range-dependent)',
  })
  activeHabits: number;

  @ApiProperty({
    example: 4,
    description:
      'Days in the range where every scheduled habit was completed. Days with nothing scheduled do not count.',
  })
  perfectDays: number;

  @ApiProperty({
    example: 5,
    description:
      'Consecutive perfect days ending today. Days with nothing scheduled are skipped without breaking the streak. ' +
      'An unfinished today does not reset it to 0 — the count then ends at yesterday. Looks back up to 365 days, ' +
      'independent of the requested range.',
  })
  currentStreak: number;

  @ApiProperty({
    example: 9,
    description: 'Longest run of perfect days within the last 365 days',
  })
  longestStreak: number;

  @ApiProperty({
    type: String,
    nullable: true,
    example: '2026-08-09',
    description:
      'Best day in the range by percent, ties broken by completed count then by the most recent date. ' +
      'Days with zero completions are never eligible, so this is null when the user completed nothing ' +
      'in the whole range.',
  })
  bestDay: string | null;
}

export class ProgressResponseDto {
  @ApiProperty({ enum: ProgressRange, example: ProgressRange.week })
  range: ProgressRange;

  @ApiProperty({ example: '2026-08-05', description: 'First day in `points`, inclusive' })
  startDate: string;

  @ApiProperty({ example: '2026-08-11', description: 'Last day in `points` — always today' })
  endDate: string;

  @ApiProperty({
    example: 'UTC',
    description:
      'Time zone every date in this payload is expressed in. Currently always UTC — the whole backend ' +
      'computes "today" in UTC. Present so clients can render correctly if this becomes configurable.',
  })
  timeZone: string;

  @ApiProperty({ type: ProgressSummaryDto })
  summary: ProgressSummaryDto;

  @ApiProperty({
    type: [ProgressPointDto],
    description: 'One entry per day, oldest first. Ready to feed a bar or line chart.',
  })
  points: ProgressPointDto[];

  @ApiProperty({
    type: [ProgressHabitDto],
    description:
      'One entry per active habit, sorted by percent descending then title. Empty when the user has no habits.',
  })
  habits: ProgressHabitDto[];
}
