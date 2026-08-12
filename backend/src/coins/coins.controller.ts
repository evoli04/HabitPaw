import { Controller, Get } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CoinsService } from './coins.service';
import { WalletDto } from './dto/wallet.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('coins')
@ApiBearerAuth('access-token')
@Controller('coins')
export class CoinsController {
  constructor(private readonly coinsService: CoinsService) {}

  @Get()
  @ApiOperation({
    summary: 'Coin balance, reward size and recent ledger rows',
    description:
      'Scoped to the caller. `habitReward` is the server-side value of one habit completion — ' +
      'read it instead of hardcoding 30 in the client.',
  })
  @ApiOkResponse({ type: WalletDto })
  getWallet(@CurrentUser() user: AuthenticatedUser): Promise<WalletDto> {
    return this.coinsService.getWallet(user.id);
  }
}
