import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const OWNED_ITEMS_KEY = 'habitpaw_shop_owned_items';
const EQUIPPED_ITEM_KEY = 'habitpaw_shop_equipped_item';
const ShopContext = createContext(null);

export function ShopProvider({ children, userId }) {
  const [ownedItemIds, setOwnedItemIds] = useState([]);
  const [equippedItemId, setEquippedItemId] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    setReady(false);
    Promise.all([
      AsyncStorage.getItem(`${OWNED_ITEMS_KEY}:${userId}`),
      AsyncStorage.getItem(`${EQUIPPED_ITEM_KEY}:${userId}`),
    ])
      .then(([storedOwnedItems, storedEquippedItem]) => {
        if (!mounted) return;
        try {
          const parsedItems = JSON.parse(storedOwnedItems ?? '[]');
          setOwnedItemIds(Array.isArray(parsedItems) ? parsedItems : []);
        } catch {
          setOwnedItemIds([]);
        }
        setEquippedItemId(storedEquippedItem || null);
      })
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, [userId]);

  const unlockItem = useCallback(async (itemId) => {
    if (!ready || ownedItemIds.includes(itemId)) return false;
    const nextItems = [...ownedItemIds, itemId];
    setOwnedItemIds(nextItems);
    await AsyncStorage.setItem(`${OWNED_ITEMS_KEY}:${userId}`, JSON.stringify(nextItems));
    return true;
  }, [ownedItemIds, ready, userId]);

  const equipItem = useCallback(async (itemId) => {
    setEquippedItemId(itemId);
    await AsyncStorage.setItem(`${EQUIPPED_ITEM_KEY}:${userId}`, itemId);
    return true;
  }, [userId]);

  const unequipItem = useCallback(async () => {
    setEquippedItemId(null);
    await AsyncStorage.removeItem(`${EQUIPPED_ITEM_KEY}:${userId}`);
  }, [userId]);

  const value = useMemo(() => ({ ready, ownedItemIds, equippedItemId, unlockItem, equipItem, unequipItem }),
    [equippedItemId, equipItem, ownedItemIds, ready, unequipItem, unlockItem]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

export function useShop() {
  const value = useContext(ShopContext);
  if (!value) throw new Error('useShop, ShopProvider içinde kullanılmalıdır.');
  return value;
}
