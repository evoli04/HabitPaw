import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { HabitsService } from './habits.service';
import { ClaimRewardResponseDto } from '../coins/dto/claim-reward.dto';
import { CreateHabitDto } from './dto/create-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('habits')
@ApiBearerAuth('access-token')
@Controller('habits')
export class HabitsController {
  constructor(private readonly habitsService: HabitsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser) {
    return this.habitsService.findAll(user.id);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHabitDto) {
    return this.habitsService.create(user.id, dto);
  }

  @Get('today')
  getToday(@CurrentUser() user: AuthenticatedUser) {
    return this.habitsService.getTodayForUser(user.id);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.habitsService.findOneOrThrow(user.id, id);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateHabitDto,
  ) {
    return this.habitsService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.habitsService.remove(user.id, id);
  }

  @Post(':id/complete')
  complete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.habitsService.complete(user.id, id);
  }

  @Delete(':id/complete')
  @HttpCode(204)
  uncomplete(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.habitsService.uncomplete(user.id, id);
  }

  @Post(':id/claim-reward')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Collect today’s coin reward for a completed habit',
    description:
      'Backs the "Coin Al" button in the celebration popup. Idempotent: a second call returns ' +
      '`awarded: 0, alreadyClaimed: true` with a 200 rather than an error. 400 when the habit ' +
      'is not completed today.',
  })
  @ApiOkResponse({ type: ClaimRewardResponseDto })
  claimReward(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ClaimRewardResponseDto> {
    return this.habitsService.claimReward(user.id, id);
  }
}
