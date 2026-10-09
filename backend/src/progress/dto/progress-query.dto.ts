import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

/**
 * Window the İlerleme (progress) screen is asking for.
 *
 * `week`  — the last 7 days, today inclusive. Fixed width, so the chart never
 *           collapses.
 * `month` — the 1st of the current calendar month up to today. Width grows
 *           through the month; on the 1st it is a single day.
 *
 * Mirror this list verbatim on the mobile side — it is the enum the client is
 * missing today.
 */
export enum ProgressRange {
  week = 'week',
  month = 'month',
}

export class ProgressQueryDto {
  @ApiPropertyOptional({
    enum: ProgressRange,
    default: ProgressRange.week,
    description:
      "'week' = last 7 days including today. 'month' = 1st of the current calendar month through today.",
  })
  @IsOptional()
  @IsEnum(ProgressRange)
  range?: ProgressRange;
}
