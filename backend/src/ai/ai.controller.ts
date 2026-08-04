import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AiService } from './ai.service';
import { SuggestHabitsDto } from './dto/suggest-habits.dto';
import { SuggestHabitsResponseDto } from './dto/habit-suggestion.dto';
import { AcceptSuggestionsDto } from './dto/accept-suggestions.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('ai')
@ApiBearerAuth('access-token')
@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  // Throttled on this route only: it is the one that spends Gemini quota.
  // `accept` just writes rows, so it stays on the normal habit limits.
  @UseGuards(ThrottlerGuard)
  @Post('habit-suggestions')
  @ApiOperation({ summary: 'Ask Gemini for habits matching a free-text goal' })
  @ApiOkResponse({ type: SuggestHabitsResponseDto })
  suggestHabits(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SuggestHabitsDto,
  ) {
    return this.aiService.suggestHabits(user.id, dto);
  }

  @Post('habit-suggestions/:id/accept')
  @ApiOperation({ summary: 'Create real habits from a stored recommendation' })
  acceptSuggestions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AcceptSuggestionsDto,
  ) {
    return this.aiService.acceptSuggestions(user.id, id, dto.indexes);
  }
}
