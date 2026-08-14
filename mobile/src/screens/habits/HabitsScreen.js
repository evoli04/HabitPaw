import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import LoadingScreen from '../../components/common/LoadingScreen';
import HabitCard from '../../components/habits/HabitCard';
import { ROUTES } from '../../constants/routes';
import { getHabits } from '../../services/habitService';
import { createStyles } from './HabitsScreen.styles';
import { layout, spacing } from '../../theme/spacing';
import { useAppTheme } from '../../hooks/useAppTheme';

export default function HabitsScreen({ navigation }) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const insets = useSafeAreaInsets();
  const bottomPadding = layout.tabBarHeight + Math.max(insets.bottom, 14) + spacing.xxl;
  const query = useQuery({ queryKey: ['habits'], queryFn: getHabits });
  if (query.isLoading) return <LoadingScreen message="Alışkanlıkların yükleniyor…" />;

  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: bottomPadding }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Alışkanlıklarım</Text>
            <Text style={styles.subtitle}>Küçük adımlarının tamamı burada.</Text>
          </View>
        </View>
        {query.isError ? (
          <ErrorState message={query.error.message} onRetry={query.refetch} />
        ) : query.data?.length ? (
          <View style={styles.list}>
            {query.data.map((habit, index) => (
              <HabitCard
                key={habit.id}
                index={index}
                habit={habit}
                onPress={() => navigation.navigate(ROUTES.HABIT_DETAIL, { id: habit.id })}
              />
            ))}
          </View>
        ) : (
          <EmptyState
            title="İlk alışkanlığını ekleyelim"
            message="Paw, yeni rutinin için seni bekliyor."
            actionTitle="Alışkanlık ekle"
            onAction={() => navigation.navigate(ROUTES.ADD_HABIT)}
          />
        )}
        <AppButton title="Yeni alışkanlık" onPress={() => navigation.navigate(ROUTES.ADD_HABIT)} />
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}
