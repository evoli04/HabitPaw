import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROUTES } from '../constants/routes';
import HomeScreen from '../screens/home/HomeScreen';
import HabitsScreen from '../screens/habits/HabitsScreen';
import ProgressScreen from '../screens/progress/ProgressScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { useAppTheme } from '../hooks/useAppTheme';

const Tab = createBottomTabNavigator();

const tabOptions = {
  [ROUTES.HOME]: { label: 'Bugün', icon: 'home-outline', activeIcon: 'home' },
  [ROUTES.HABITS]: { label: 'Alışkanlıklar', icon: 'checkmark-circle-outline', activeIcon: 'checkmark-circle' },
  [ROUTES.PROGRESS]: { label: 'İlerleme', icon: 'stats-chart-outline', activeIcon: 'stats-chart' },
  [ROUTES.PROFILE]: { label: 'Profil', icon: 'person-outline', activeIcon: 'person' },
};

export default function MainTabNavigator() {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          position: 'absolute',
          left: 18,
          right: 18,
          bottom: Math.max(insets.bottom, 14),
          height: 74,
          paddingTop: 10,
          paddingBottom: 10,
          borderTopWidth: 0,
          borderRadius: 28,
          backgroundColor: colors.surface,
          elevation: 8,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.1,
          shadowRadius: 18,
        },
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
        tabBarIcon: ({ color, size, focused }) => {
          const config = tabOptions[route.name];
          return (
            <Ionicons
              name={focused ? config.activeIcon : config.icon}
              color={color}
              size={focused ? size + 2 : size}
            />
          );
        },
      })}
    >
      {Object.entries(tabOptions).map(([name, config]) => {
        const components = {
          [ROUTES.HOME]: HomeScreen,
          [ROUTES.HABITS]: HabitsScreen,
          [ROUTES.PROGRESS]: ProgressScreen,
          [ROUTES.PROFILE]: ProfileScreen,
        };
        return <Tab.Screen key={name} name={name} component={components[name]} options={{ tabBarLabel: config.label }} />;
      })}
    </Tab.Navigator>
  );
}
