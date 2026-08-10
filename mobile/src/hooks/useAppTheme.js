import { useContext } from 'react';
import { ThemeContext } from '../contexts/ThemeContext';

export function useAppTheme() {
  const value = useContext(ThemeContext);
  if (!value) throw new Error('useAppTheme, ThemeProvider içinde kullanılmalıdır.');
  return value;
}
