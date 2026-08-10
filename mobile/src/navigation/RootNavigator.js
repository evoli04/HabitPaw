import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import LoadingScreen from '../components/common/LoadingScreen';
import { useAuth } from '../hooks/useAuth';
import { useAppTheme } from '../hooks/useAppTheme';
import AppNavigator from './AppNavigator';
import AuthNavigator from './AuthNavigator';

export default function RootNavigator() {
  const { session, initializing } = useAuth();
  const { colors, isDark } = useAppTheme();
  const navigationTheme = {
    ...DefaultTheme,
    dark: isDark,
    colors: {
      ...DefaultTheme.colors,
      primary: colors.primary,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      notification: colors.danger,
    },
  };
  if (initializing) return <LoadingScreen message="Oturum kontrol ediliyor…" />;

  return (
    <NavigationContainer theme={navigationTheme}>
      {session ? <AppNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
