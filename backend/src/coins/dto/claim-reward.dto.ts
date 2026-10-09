import { ApiProperty } from '@nestjs/swagger';

export class ClaimRewardResponseDto {
  @ApiProperty({
    example: 30,
    description: 'Coins added by this call. 0 when the reward was already taken.',
  })
  awarded: number;

  @ApiProperty({ example: 30, description: 'Balance after the call' })
  balance: number;

  @ApiProperty({
    example: false,
    description:
      'True when this habit’s reward for today had already been claimed. The call still returns 200 — ' +
      'tapping the claim button twice must not surface an error.',
  })
  alreadyClaimed: boolean;
}
