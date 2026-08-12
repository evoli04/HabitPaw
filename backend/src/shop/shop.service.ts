import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CoinsService } from '../coins/coins.service';
import { SHOP_CATALOG, findCatalogItem } from './shop-catalog';
import { ShopCatalogResponseDto } from './dto/shop-item.dto';

@Injectable()
export class ShopService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coins: CoinsService,
  ) {}

  /** Catalog + the caller's ownership state + balance, in one payload. */
  async listItems(userId: string): Promise<ShopCatalogResponseDto> {
    const [balance, owned] = await Promise.all([
      this.coins.getBalance(userId),
      this.prisma.userShopItem.findMany({
        where: { userId },
        select: { itemId: true, equipped: true },
      }),
    ]);

    const ownedById = new Map(owned.map((row) => [row.itemId, row]));

    return {
      balance,
      items: SHOP_CATALOG.map((item) => ({
        ...item,
        owned: ownedById.has(item.id),
        equipped: ownedById.get(item.id)?.equipped ?? false,
      })),
    };
  }

  /**
   * Buys an item. Ownership row and payment happen in one transaction, so a
   * failure on either side cannot leave the user charged without the item —
   * or holding an item they did not pay for.
   */
  async purchase(
    userId: string,
    itemId: string,
  ): Promise<ShopCatalogResponseDto> {
    const item = findCatalogItem(itemId);
    if (!item) throw new NotFoundException('Shop item not found');

    try {
      await this.prisma.$transaction(async (tx) => {
        // Created first: a duplicate purchase trips the unique constraint here
        // and rolls back before any coins move.
        await tx.userShopItem.create({
          data: { userId, itemId: item.id, pricePaid: item.price },
        });

        const balance = await this.coins.spend(tx, userId, item.price, item.id);
        if (balance === null) {
          throw new BadRequestException('Bu aksesuar için yeterli coinin yok');
        }
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Bu aksesuara zaten sahipsin');
      }
      throw error;
    }

    return this.listItems(userId);
  }

  /**
   * Wears `itemId`, or takes everything off when it is null.
   *
   * "At most one equipped item" is held by clearing the flag on every row and
   * setting it on one, inside a transaction. A partial unique index would state
   * the rule in the schema, but Prisma cannot express one without raw SQL.
   */
  async setEquipped(
    userId: string,
    itemId: string | null,
  ): Promise<ShopCatalogResponseDto> {
    if (itemId !== null) {
      if (!findCatalogItem(itemId)) {
        throw new NotFoundException('Shop item not found');
      }
      const owned = await this.prisma.userShopItem.findUnique({
        where: { userId_itemId: { userId, itemId } },
        select: { id: true },
      });
      if (!owned) {
        throw new BadRequestException('Sahip olmadığın bir aksesuarı kuşanamazsın');
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.userShopItem.updateMany({
        where: { userId, equipped: true },
        data: { equipped: false },
      });
      if (itemId !== null) {
        await tx.userShopItem.update({
          where: { userId_itemId: { userId, itemId } },
          data: { equipped: true },
        });
      }
    });

    return this.listItems(userId);
  }
}
