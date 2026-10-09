import { Controller, Get, Query } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ProgressService } from './progress.service';
import { ProgressQueryDto, ProgressRange } from './dto/progress-query.dto';
import { ProgressResponseDto } from './dto/progress-response.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('progress')
@ApiBearerAuth('access-token')
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({
    summary: 'Chart-ready completion history for the İlerleme screen',
    description:
      'Returns one point per day for the requested window plus range totals, streaks and a per-habit ' +
      'breakdown. Everything is scoped to the caller — the user id comes from the bearer token, never ' +
      'from the request. All dates are UTC.',
  })
  @ApiOkResponse({ type: ProgressResponseDto })
  getProgress(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ProgressQueryDto,
  ): Promise<ProgressResponseDto> {
    return this.progressService.getProgress(
      user.id,
      query.range ?? ProgressRange.week,
    );
  }
}
