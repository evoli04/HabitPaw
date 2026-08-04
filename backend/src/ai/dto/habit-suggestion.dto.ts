import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HabitFrequency } from '@prisma/client';

/** One AI-generated habit. Field shapes mirror `CreateHabitDto` so it can be accepted as-is. */
export class HabitSuggestionDto {
  @ApiProperty({ maxLength: 100, example: 'Sabah 10 dakika yürüyüş' })
  title: string;

  @ApiProperty({
    maxLength: 500,
    example: 'Kahvaltıdan önce mahallede kısa bir tur at.',
  })
  description: string;

  @ApiProperty({ enum: HabitFrequency, example: HabitFrequency.daily })
  frequency: HabitFrequency;

  @ApiPropertyOptional({
    example: '08:00',
    description: 'HH:mm, may be absent',
  })
  reminderTime?: string;

  @ApiProperty({ example: 'Güne hareketle başlamak enerjini yükseltir.' })
  reason: string;
}

export class SuggestHabitsResponseDto {
  @ApiProperty({
    description: 'Id of the stored AiRecommendation row — pass it to /accept',
  })
  recommendationId: string;

  @ApiProperty({
    example: 'gemini-3.5-flash',
    description: 'Model that produced the suggestions',
  })
  model: string;

  @ApiProperty({ type: [HabitSuggestionDto] })
  suggestions: HabitSuggestionDto[];
}
