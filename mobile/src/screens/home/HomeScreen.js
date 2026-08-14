import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { RefreshControl, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import LoadingScreen from '../../components/common/LoadingScreen';
import CatCharacter from '../../components/cat/CatCharacter';
import CatMoodMessage from '../../components/cat/CatMoodMessage';
import CelebrationPopup from '../../components/cat/CelebrationPopup';
import DailyProgressCard from '../../components/habits/DailyProgressCard';
import HabitCard from '../../components/habits/HabitCard';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { completeHabit, getTodayHabits, uncompleteHabit } from '../../services/habitService';
import { getCatMood } from '../../utils/catMood';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getProfile } from '../../services/profileService';
import { syncHabitReminder } from '../../services/notificationService';
import { getDisplayName } from '../../utils/displayName';
import { useCoins } from '../../contexts/CoinContext';
import { useAppDialog } from '../../contexts/DialogContext';
import { useShop } from '../../contexts/ShopContext';
import { layout, spacing } from '../../theme/spacing';
import { createStyles } from './HomeScreen.styles';

export default function HomeScreen({ navigation }) {
  const { user } = useAuth();
  const { colors } = useAppTheme();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const compact = width < 360 || height < 700;
  const styles = useMemo(() => createStyles(colors, compact), [colors, compact]);
  const tabOffset = Math.max(insets.bottom, 14);
  const scrollBottomPadding = layout.tabBarHeight + tabOffset + spacing.lg;
  const queryClient = useQueryClient();
  const [activeId, setActiveId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const closeCelebration = useCallback(() => setCelebration(null), []);
  const [claimingReward, setClaimingReward] = useState(false);
  const { habitReward, claimReward } = useCoins();
  const { equippedItemId } = useShop();
  const { showDialog } = useAppDialog();
  const todayQuery = useQuery({ queryKey: ['habits', 'today'], queryFn: getTodayHabits });
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const mutation = useMutation({
    mutationFn: ({ id, completed }) => (completed ? uncompleteHabit(id) : completeHabit(id)),
    onSettled: () => setActiveId(null),
    onSuccess: async (_response, variables) => {
      if (!variables.completed) {
        setCelebration({ id: variables.id, title: variables.title });
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits', 'today'] }),
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['progress'] }),
      ]);
    },
  });

  const habits = todayQuery.data ?? [];

  useEffect(() => {
    if (!todayQuery.data) return;
    Promise.all(todayQuery.data.map((habit) => syncHabitReminder(habit).catch(() => false)));
  }, [todayQuery.data]);
  const completed = habits.filter((habit) => habit.completedToday).length;
  const mood = getCatMood(completed, habits.length);
  const displayName = getDisplayName(user, profileQuery.data);
  const date = new Intl.DateTimeFormat('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const toggle = (habit) => {
    setActiveId(habit.id);
    mutation.mutate({ id: habit.id, completed: habit.completedToday, title: habit.title });
  };

  const collectReward = async () => {
    if (!celebration) return;
    setClaimingReward(true);
    try {
      await claimReward(celebration.id);
      closeCelebration();
    } catch (error) {
      showDialog({ title: 'Ödül alınamadı', message: error.message, tone: 'danger' });
    } finally {
      setClaimingReward(false);
    }
  };

  if (todayQuery.isLoading) return <LoadingScreen message="Bugünün alışkanlıkları hazırlanıyor…" />;

  return (
    <AppBackground>
      <CelebrationPopup
        visible={Boolean(celebration)}
        habitTitle={celebration?.title}
        reward={habitReward}
        claiming={claimingReward}
        onClaim={collectReward}
        onClose={closeCelebration}
      />
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={todayQuery.isRefetching}
              onRefresh={todayQuery.refetch}
              tintColor={colors.primary}
              colors={[colors.primary]}
              progressBackgroundColor={colors.surface}
            />
          }
        >
          <View>
            <Text style={styles.greeting}>Merhaba {displayName} 👋</Text>
            <Text style={styles.date}>{date}</Text>
          </View>
          <View style={styles.catArea}>
            <CatCharacter mood={mood} equippedItemId={equippedItemId} prominent />
            <CatMoodMessage mood={mood} />
          </View>
          <DailyProgressCard completed={completed} total={habits.length} />
          {mutation.error ? <Text style={styles.error}>{mutation.error.message}</Text> : null}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Bugünün alışkanlıkları</Text>
          </View>
          {todayQuery.isError ? (
            <ErrorState message={todayQuery.error.message} onRetry={todayQuery.refetch} />
          ) : habits.length === 0 ? (
            <EmptyState
              title="İlk alışkanlığını ekleyelim"
              message="Paw, seninle birlikte yeni bir rutin oluşturmaya hazır."
              actionTitle="Alışkanlık ekle"
              onAction={() => navigation.navigate(ROUTES.ADD_HABIT)}
            />
          ) : (
            <View style={styles.list}>
              {habits.map((habit, index) => (
                <HabitCard
                  key={habit.id}
                  index={index}
                  habit={habit}
                  toggling={mutation.isPending && activeId === habit.id}
                  onToggle={() => toggle(habit)}
                />
              ))}
            </View>
          )}
          <AppButton
            title="Yeni alışkanlık ekle"
            icon="add"
            onPress={() => navigation.navigate(ROUTES.ADD_HABIT)}
          />
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
