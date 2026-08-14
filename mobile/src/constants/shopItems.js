export const SHOP_ITEMS = [
  {
    id: 'bowtie',
    name: 'Papyon',
    description: 'Paw için sevimli ve şık bir papyon.',
    price: 60,
    shopImage: require('../../assets/accessories/bowtie.png'),
    previewScale: 3.6,
  },
  {
    id: 'medal',
    name: 'Madalya',
    description: 'Tamamlanan alışkanlıkların gurur madalyası.',
    price: 120,
    shopImage: require('../../assets/accessories/medal.png'),
    previewScale: 3.5,
  },
  {
    id: 'party_hat',
    name: 'Parti şapkası',
    description: 'Kutlama günlerinde Paw’ın neşesine neşe katar.',
    price: 180,
    shopImage: require('../../assets/accessories/party-hat.png'),
    previewScale: 2.7,
    previewOffsetY: 92,
  },
  {
    id: 'gold_necklace',
    name: 'Altın kolye',
    description: 'Mağazanın en değerli ve en özel aksesuarı.',
    price: 300,
    shopImage: require('../../assets/accessories/gold-necklace.png'),
    previewScale: 3.4,
    premium: true,
  },
];

export const SHOP_ITEM_BY_ID = Object.fromEntries(SHOP_ITEMS.map((item) => [item.id, item]));
