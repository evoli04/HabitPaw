import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../constants/routes';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import { colors } from '../theme/colors';

const Stack = createNativeStackNavigator();

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        animation: 'fade_from_bottom',
        headerShadowVisible: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.textPrimary,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name={ROUTES.WELCOME} component={WelcomeScreen} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.LOGIN} component={LoginScreen} options={{ title: 'Giriş yap' }} />
      <Stack.Screen name={ROUTES.REGISTER} component={RegisterScreen} options={{ title: 'Kayıt ol' }} />
    </Stack.Navigator>
  );
}
