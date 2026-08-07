import { Alert, ScrollView, Text, View } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import ErrorState from '../../components/common/ErrorState';
import LoadingScreen from '../../components/common/LoadingScreen';
import { getFrequencyLabel } from '../../constants/habits';
import { ROUTES } from '../../constants/routes';
import { deleteHabit, getHabitById } from '../../services/habitService';
import { formatReminderTime } from '../../utils/timeUtils';
import { styles } from './HabitDetailScreen.styles';

export default function HabitDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const queryClient = useQueryClient();
  const query = useQuery({ queryKey: ['habits', id], queryFn: () => getHabitById(id) });
  const removeMutation = useMutation({
    mutationFn: () => deleteHabit(id),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: ['habits', id] });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['habits', 'today'] }),
      ]);
      navigation.goBack();
    },
    onError: (error) => Alert.alert('Silinemedi', error.message),
  });

  const confirmDelete = () => {
    Alert.alert(
      'Alışkanlığı sil',
      'Bu alışkanlık ve tamamlama kayıtları kalıcı olarak silinecek. Emin misin?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => removeMutation.mutate() },
      ],
    );
  };

  if (query.isLoading) return <LoadingScreen message="Alışkanlık yükleniyor…" />;
  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={query.error.message} onRetry={query.refetch} />
      </SafeAreaView>
    );
  }

  const habit = query.data;
  const reminder = formatReminderTime(habit.reminderTime);
  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.paw}>🐾</Text>
          <Text style={styles.title}>{habit.title}</Text>
          <Text style={styles.status}>{habit.isActive === false ? 'Pasif' : 'Aktif'}</Text>
        </View>
        <View style={styles.card}>
          <DetailRow label="Açıklama" value={habit.description || 'Açıklama eklenmemiş'} />
          <DetailRow label="Sıklık" value={getFrequencyLabel(habit.frequency)} />
          <DetailRow label="Hatırlatma" value={reminder || 'Ayarlanmamış'} />
          <DetailRow
            label="Oluşturulma"
            value={new Intl.DateTimeFormat('tr-TR', { dateStyle: 'long' }).format(new Date(habit.createdAt))}
          />
        </View>
        <View style={styles.actions}>
          <AppButton
            title="Düzenle"
            onPress={() => navigation.navigate(ROUTES.EDIT_HABIT, { id })}
          />
          <AppButton
            title="Alışkanlığı sil"
            variant="outline"
            loading={removeMutation.isPending}
            onPress={confirmDelete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}

function DetailRow({ label, value }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}
