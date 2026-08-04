import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsInt,
  Min,
} from 'class-validator';

export class AcceptSuggestionsDto {
  @ApiProperty({
    type: [Number],
    example: [0, 2],
    description:
      "Zero-based indexes into the stored recommendation's suggestions array",
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(10)
  @IsInt({ each: true })
  @Min(0, { each: true })
  indexes: number[];
}
