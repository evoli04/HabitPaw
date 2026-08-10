import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from '../theme/colors';

const THEME_PREFERENCE_KEY = 'habitpaw_theme_preference';
const VALID_PREFERENCES = new Set(['system', 'light', 'dark']);

export const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const systemColorScheme = useColorScheme();
  const [preference, setPreference] = useState('system');
  const [themeInitializing, setThemeInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_PREFERENCE_KEY)
      .then((storedPreference) => {
        if (mounted && VALID_PREFERENCES.has(storedPreference)) {
          setPreference(storedPreference);
        }
      })
      .catch((error) => {
        if (__DEV__) console.warn('Tema tercihi okunamadı.', error.message);
      })
      .finally(() => {
        if (mounted) setThemeInitializing(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setThemePreference = useCallback(async (nextPreference) => {
    if (!VALID_PREFERENCES.has(nextPreference)) return;
    setPreference(nextPreference);
    try {
      await AsyncStorage.setItem(THEME_PREFERENCE_KEY, nextPreference);
    } catch (error) {
      if (__DEV__) console.warn('Tema tercihi kaydedilemedi.', error.message);
    }
  }, []);

  const resolvedScheme = preference === 'system'
    ? systemColorScheme === 'dark' ? 'dark' : 'light'
    : preference;
  const isDark = resolvedScheme === 'dark';

  const value = useMemo(
    () => ({
      colorScheme: resolvedScheme,
      systemColorScheme: systemColorScheme === 'dark' ? 'dark' : 'light',
      isDark,
      colors: isDark ? darkColors : lightColors,
      preference,
      setThemePreference,
      themeInitializing,
    }),
    [isDark, preference, resolvedScheme, setThemePreference, systemColorScheme, themeInitializing],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
