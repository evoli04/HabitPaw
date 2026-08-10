import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { useAppTheme } from './src/hooks/useAppTheme';
import LoadingScreen from './src/components/common/LoadingScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { DialogProvider } from './src/contexts/DialogContext';
import { CoinProvider } from './src/contexts/CoinContext';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <DialogProvider>
          <CoinProvider>
            <AppContent />
          </CoinProvider>
        </DialogProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function AppContent() {
  const { isDark, themeInitializing } = useAppTheme();
  if (themeInitializing) {
    return <LoadingScreen message="Tema hazırlanıyor…" />;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
