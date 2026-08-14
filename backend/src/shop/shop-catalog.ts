export interface ShopCatalogItem {
  id: string;
  name: string;
  description: string;
  price: number;
  /** Purely a UI badge ("EN ÖZEL"); it does not gate the purchase. */
  premium: boolean;
}

/**
 * Mirrors `mobile/src/constants/shopItems.js` minus the artwork: `image` and
 * `previewStyle` stay in the app bundle and are matched up by `id`.
 *
 * Prices live here rather than in the database because adding an item requires
 * shipping its image with the app anyway — a table would only buy price edits
 * without a deploy, at the cost of a seed migration. What matters is that the
 * price is *server-side*: the client must never be the authority on cost.
 */
export const SHOP_CATALOG: ShopCatalogItem[] = [
  {
    id: 'bowtie',
    name: 'Papyon',
    description: 'Paw için sevimli ve şık bir papyon.',
    price: 2000,
    premium: false,
  },
  {
    id: 'medal',
    name: 'Madalya',
    description: 'Tamamlanan alışkanlıkların gurur madalyası.',
    price: 3700,
    premium: false,
  },
  {
    id: 'party_hat',
    name: 'Parti şapkası',
    description: 'Kutlama günlerinde Paw’ın neşesine neşe katar.',
    price: 3000,
    premium: false,
  },
  {
    id: 'gold_necklace',
    name: 'Altın kolye',
    description: 'Mağazanın en değerli ve en özel aksesuarı.',
    price: 7000,
    premium: true,
  },
];

export function findCatalogItem(id: string): ShopCatalogItem | undefined {
  return SHOP_CATALOG.find((item) => item.id === id);
}
