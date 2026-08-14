import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { claimHabitReward, getWallet } from '../services/coinService';

const CoinContext = createContext(null);

export function CoinProvider({ children, userId }) {
  const [balance, setBalance] = useState(0);
  const [habitReward, setHabitReward] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [ready, setReady] = useState(false);

  const syncBalance = useCallback((nextBalance) => {
    if (Number.isFinite(nextBalance)) setBalance(nextBalance);
  }, []);

  const refreshWallet = useCallback(async () => {
    const wallet = await getWallet();
    setBalance(wallet.balance);
    setHabitReward(wallet.habitReward);
    setRecentTransactions(wallet.recentTransactions ?? []);
    return wallet;
  }, []);

  useEffect(() => {
    let mounted = true;
    setReady(false);
    getWallet()
      .then((wallet) => {
        if (!mounted) return;
        setBalance(wallet.balance);
        setHabitReward(wallet.habitReward);
        setRecentTransactions(wallet.recentTransactions ?? []);
      })
      .catch(() => undefined)
      .finally(() => mounted && setReady(true));
    return () => { mounted = false; };
  }, [userId]);

  const claimReward = useCallback(async (habitId) => {
    const result = await claimHabitReward(habitId);
    setBalance(result.balance);
    await refreshWallet();
    return result;
  }, [refreshWallet]);

  const value = useMemo(
    () => ({ balance, habitReward, recentTransactions, ready, claimReward, refreshWallet, syncBalance }),
    [balance, claimReward, habitReward, ready, recentTransactions, refreshWallet, syncBalance],
  );

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
}

export function useCoins() {
  const value = useContext(CoinContext);
  if (!value) throw new Error('useCoins, CoinProvider içinde kullanılmalıdır.');
  return value;
}
