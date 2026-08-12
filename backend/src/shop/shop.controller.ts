import { Body, Controller, Get, HttpCode, Param, Post, Put } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { ShopService } from './shop.service';
import { EquipItemDto } from './dto/equip.dto';
import { ShopCatalogResponseDto } from './dto/shop-item.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';

@ApiTags('shop')
@ApiBearerAuth('access-token')
@Controller('shop')
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('items')
  @ApiOperation({
    summary: 'Accessory catalog with the caller’s ownership state and balance',
    description:
      'Artwork is not returned — the client keeps the images and matches them by `id`.',
  })
  @ApiOkResponse({ type: ShopCatalogResponseDto })
  listItems(
    @CurrentUser() user: AuthenticatedUser,
  ): Promise<ShopCatalogResponseDto> {
    return this.shopService.listItems(user.id);
  }

  @Post('items/:id/purchase')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Buy an accessory',
    description:
      'Returns the refreshed catalog so the shop screen can re-render without a second call. ' +
      '400 when the balance is short, 409 when the item is already owned.',
  })
  @ApiOkResponse({ type: ShopCatalogResponseDto })
  purchase(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ): Promise<ShopCatalogResponseDto> {
    return this.shopService.purchase(user.id, id);
  }

  @Put('equipped')
  @ApiOperation({
    summary: 'Put an accessory on, or take the current one off',
    description: 'Body `{ "itemId": "bow" }` to wear, `{ "itemId": null }` to remove.',
  })
  @ApiOkResponse({ type: ShopCatalogResponseDto })
  setEquipped(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: EquipItemDto,
  ): Promise<ShopCatalogResponseDto> {
    return this.shopService.setEquipped(user.id, dto.itemId ?? null);
  }
}
