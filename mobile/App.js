import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from './src/contexts/AuthContext';
import { useAuth } from './src/hooks/useAuth';
import { ThemeProvider } from './src/contexts/ThemeContext';
import { useAppTheme } from './src/hooks/useAppTheme';
import LoadingScreen from './src/components/common/LoadingScreen';
import RootNavigator from './src/navigation/RootNavigator';
import { DialogProvider } from './src/contexts/DialogContext';
import { CoinProvider } from './src/contexts/CoinContext';
import { ShopProvider } from './src/contexts/ShopContext';

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
          <AppContent />
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
        <SessionContent isDark={isDark} />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function SessionContent({ isDark }) {
  const { user } = useAuth();
  const content = (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </>
  );

  if (!user) return content;

  return (
    <CoinProvider key={user.id} userId={user.id}>
      <ShopProvider userId={user.id}>{content}</ShopProvider>
    </CoinProvider>
  );
}
