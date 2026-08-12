import { ApiProperty } from '@nestjs/swagger';

/**
 * A catalog entry merged with the caller's ownership state. Artwork is not
 * here — the client holds `image`/`previewStyle` and matches on `id`.
 */
export class ShopItemDto {
  @ApiProperty({
    example: 'bow',
    description: 'Stable catalog id — the key the client maps to a local image',
  })
  id: string;

  @ApiProperty({ example: 'Papyon' })
  name: string;

  @ApiProperty({ example: 'Paw için sevimli ve şık bir papyon.' })
  description: string;

  @ApiProperty({ example: 60, description: 'Authoritative price in coins' })
  price: number;

  @ApiProperty({
    example: false,
    description: 'UI badge only ("EN ÖZEL") — does not restrict purchasing',
  })
  premium: boolean;

  @ApiProperty({ example: false, description: 'Caller already bought this' })
  owned: boolean;

  @ApiProperty({
    example: false,
    description: 'Caller is currently wearing this. At most one item is equipped.',
  })
  equipped: boolean;
}

export class ShopCatalogResponseDto {
  @ApiProperty({
    example: 90,
    description: 'Current balance, so the shop screen renders in one request',
  })
  balance: number;

  @ApiProperty({ type: [ShopItemDto] })
  items: ShopItemDto[];
}
