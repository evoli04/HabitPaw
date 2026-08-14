import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { SHOP_ITEM_BY_ID } from '../constants/shopItems';
import { getShopItems, purchaseShopItem, setEquippedShopItem } from '../services/shopService';
import { useCoins } from './CoinContext';

const ShopContext = createContext(null);

function normalizeCatalog(response) {
  return (response.items ?? []).map((item) => ({ ...SHOP_ITEM_BY_ID[item.id], ...item }));
}

export function ShopProvider({ children, userId }) {
  const { syncBalance } = useCoins();
  const [items, setItems] = useState([]);
  const [ready, setReady] = useState(false);

  const applyCatalog = useCallback((response) => {
    setItems(normalizeCatalog(response));
    syncBalance(response.balance);
    return response;
  }, [syncBalance]);

  const refreshShop = useCallback(async () => {
    const response = await getShopItems();
    return applyCatalog(response);
  }, [applyCatalog]);

  useEffect(() => {
    let mounted = true;
    setReady(false);
    getShopItems()
      .then((response) => {
        if (mounted) applyCatalog(response);
      })
      .catch(() => undefined)
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, [applyCatalog, userId]);

  const purchaseItem = useCallback(async (itemId) => {
    const response = await purchaseShopItem(itemId);
    applyCatalog(response);
    return response;
  }, [applyCatalog]);

  const equipItem = useCallback(async (itemId) => {
    const response = await setEquippedShopItem(itemId);
    applyCatalog(response);
    return response;
  }, [applyCatalog]);

  const unequipItem = useCallback(async () => {
    const response = await setEquippedShopItem(null);
    applyCatalog(response);
    return response;
  }, [applyCatalog]);

  const ownedItemIds = useMemo(() => items.filter((item) => item.owned).map((item) => item.id), [items]);
  const equippedItem = useMemo(() => items.find((item) => item.equipped) ?? null, [items]);
  const equippedItemId = equippedItem?.id ?? null;

  const value = useMemo(
    () => ({ ready, items, ownedItemIds, equippedItem, equippedItemId, refreshShop, purchaseItem, equipItem, unequipItem }),
    [equipItem, equippedItem, equippedItemId, items, ownedItemIds, purchaseItem, ready, refreshShop, unequipItem],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error('useShop, ShopProvider içinde kullanılmalıdır.');
  return value;
}
