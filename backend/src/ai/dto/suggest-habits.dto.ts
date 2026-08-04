import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export enum ExperienceLevel {
  beginner = 'beginner',
  intermediate = 'intermediate',
  advanced = 'advanced',
}

export class SuggestHabitsDto {
  @ApiProperty({
    maxLength: 300,
    example: 'Daha üretken olmak ve sabahları erken kalkmak istiyorum',
    description:
      'Free-text goal written by the user — the context sent to the AI',
  })
  @IsString()
  @MaxLength(300)
  goal: string;

  @ApiPropertyOptional({
    minimum: 5,
    maximum: 240,
    example: 20,
    description: 'Minutes per day',
  })
  @IsOptional()
  @IsInt()
  @Min(5)
  @Max(240)
  dailyMinutes?: number;

  @ApiPropertyOptional({
    enum: ExperienceLevel,
    default: ExperienceLevel.beginner,
  })
  @IsOptional()
  @IsEnum(ExperienceLevel)
  level?: ExperienceLevel;

  @ApiPropertyOptional({
    maxLength: 500,
    description: 'Extra constraints, e.g. "no gym access"',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
