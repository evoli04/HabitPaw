import { useQuery } from '@tanstack/react-query';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorState from '../../components/common/ErrorState';
import AppBackground from '../../components/common/AppBackground';
import LoadingScreen from '../../components/common/LoadingScreen';
import DailyProgressCard from '../../components/habits/DailyProgressCard';
import { getTodayHabits } from '../../services/habitService';
import { styles } from './ProgressScreen.styles';

export default function ProgressScreen() {
  const query = useQuery({ queryKey: ['habits', 'today'], queryFn: getTodayHabits });
  if (query.isLoading) return <LoadingScreen message="İlerlemen hesaplanıyor…" />;

  const habits = query.data ?? [];
  const completed = habits.filter((habit) => habit.completedToday).length;
  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={query.isRefetching} onRefresh={query.refetch} />}
      >
        <View>
          <Text style={styles.title}>İlerleme</Text>
          <Text style={styles.subtitle}>Bugünkü küçük zaferlerin.</Text>
        </View>
        {query.isError ? (
          <ErrorState message={query.error.message} onRetry={query.refetch} />
        ) : (
          <DailyProgressCard completed={completed} total={habits.length} />
        )}
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Yakında</Text>
          <Text style={styles.infoText}>
            Haftalık istatistikler backend desteği tamamlandığında burada gösterilecek.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}
