import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ROUTES } from '../constants/routes';
import AddHabitScreen from '../screens/habits/AddHabitScreen';
import EditHabitScreen from '../screens/habits/EditHabitScreen';
import HabitDetailScreen from '../screens/habits/HabitDetailScreen';
import { useAppTheme } from '../hooks/useAppTheme';
import MainTabNavigator from './MainTabNavigator';
import ShopScreen from '../screens/shop/ShopScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { colors } = useAppTheme();
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
      <Stack.Screen name={ROUTES.MAIN_TABS} component={MainTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name={ROUTES.ADD_HABIT} component={AddHabitScreen} options={{ title: 'Yeni alışkanlık' }} />
      <Stack.Screen name={ROUTES.HABIT_DETAIL} component={HabitDetailScreen} options={{ title: 'Alışkanlık detayı' }} />
      <Stack.Screen name={ROUTES.EDIT_HABIT} component={EditHabitScreen} options={{ title: 'Alışkanlığı düzenle' }} />
      <Stack.Screen name={ROUTES.SHOP} component={ShopScreen} options={{ title: 'Paw Mağazası' }} />
    </Stack.Navigator>
  );
}
