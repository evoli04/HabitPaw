import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const BALANCE_KEY = 'habitpaw_coin_balance';
const CLAIMS_KEY = 'habitpaw_coin_claims';
export const HABIT_REWARD = 30;

const CoinContext = createContext(null);

const todayKey = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export function CoinProvider({ children }) {
  const [balance, setBalance] = useState(0);
  const [claims, setClaims] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    Promise.all([AsyncStorage.getItem(BALANCE_KEY), AsyncStorage.getItem(CLAIMS_KEY)])
      .then(([storedBalance, storedClaims]) => {
        if (!mounted) return;
        const parsedBalance = Number(storedBalance);
        setBalance(Number.isFinite(parsedBalance) && parsedBalance >= 0 ? parsedBalance : 0);
        try {
          const parsedClaims = JSON.parse(storedClaims ?? '[]');
          setClaims(Array.isArray(parsedClaims) ? parsedClaims : []);
        } catch {
          setClaims([]);
        }
      })
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, []);

  const claimKey = useCallback((habitId) => `${todayKey()}:${habitId}`, []);
  const canClaim = useCallback(
    (habitId) => ready && !claims.includes(claimKey(habitId)),
    [claimKey, claims, ready],
  );

  const claimReward = useCallback(async (habitId) => {
    const key = claimKey(habitId);
    if (!ready || claims.includes(key)) return false;

    const nextBalance = balance + HABIT_REWARD;
    const nextClaims = [...claims.filter((item) => item.startsWith(todayKey())), key];
    setBalance(nextBalance);
    setClaims(nextClaims);
    await Promise.all([
      AsyncStorage.setItem(BALANCE_KEY, String(nextBalance)),
      AsyncStorage.setItem(CLAIMS_KEY, JSON.stringify(nextClaims)),
    ]);
    return true;
  }, [balance, claimKey, claims, ready]);

  const value = useMemo(
    () => ({ balance, ready, canClaim, claimReward }),
    [balance, canClaim, claimReward, ready],
  );

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
}

export function useCoins() {
  const value = useContext(CoinContext);
  if (!value) throw new Error('useCoins, CoinProvider içinde kullanılmalıdır.');
  return value;
}
