import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EquipItemDto {
  @ApiPropertyOptional({
    type: String,
    nullable: true,
    example: 'bowtie',
    description:
      'Catalog id to put on. Send null (or omit) to take the current accessory off.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  itemId?: string | null;
}
