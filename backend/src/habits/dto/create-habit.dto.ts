import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { HabitFrequency } from '@prisma/client';

export class CreateHabitDto {
  @ApiProperty({ maxLength: 100, example: 'Drink water' })
  @IsString()
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ enum: HabitFrequency, default: HabitFrequency.daily })
  @IsOptional()
  @IsEnum(HabitFrequency)
  frequency?: HabitFrequency;

  @ApiPropertyOptional({ example: '08:00', description: 'HH:mm 24-hour format' })
  @IsOptional()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'reminderTime must be in HH:mm format',
  })
  reminderTime?: string;
}
