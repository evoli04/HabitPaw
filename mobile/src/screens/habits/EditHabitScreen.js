import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorState from '../../components/common/ErrorState';
import AppBackground from '../../components/common/AppBackground';
import LoadingScreen from '../../components/common/LoadingScreen';
import HabitForm from '../../components/habits/HabitForm';
import { getHabitById, updateHabit } from '../../services/habitService';
import { formatReminderTime } from '../../utils/timeUtils';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './HabitFormScreen.styles';

export default function EditHabitScreen({ route, navigation }) {
  const { id } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');
  const query = useQuery({ queryKey: ['habits', id], queryFn: () => getHabitById(id) });
  const mutation = useMutation({
    mutationFn: (payload) => updateHabit(id, payload),
    onSuccess: async (habit) => {
      queryClient.setQueryData(['habits', id], habit);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['habits', 'today'] }),
      ]);
      Alert.alert('Güncellendi', 'Alışkanlığındaki değişiklikler kaydedildi.', [
        { text: 'Tamam', onPress: navigation.goBack },
      ]);
    },
    onError: (reason) => setError(reason.message),
  });

  if (query.isLoading) return <LoadingScreen message="Alışkanlık hazırlanıyor…" />;
  if (query.isError) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ErrorState message={query.error.message} onRetry={query.refetch} />
      </SafeAreaView>
    );
  }

  const reminder = formatReminderTime(query.data.reminderTime);
  const submit = (payload, restoredReminder) => {
    setError('');
    if (restoredReminder) {
      Alert.alert(
        'Hatırlatma korunacak',
        'Backend mevcut hatırlatmayı kaldırmayı desteklemiyor. Kayıtlı saat değiştirilmeden bırakılacak.',
        [{ text: 'Anladım', onPress: () => mutation.mutate(payload) }],
      );
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.description}>Yalnızca değiştirmek istediğin bilgileri düzenle.</Text>
        <HabitForm
          defaultValues={{ ...query.data, reminderTime: reminder }}
          existingReminder={reminder}
          submitTitle="Değişiklikleri kaydet"
          loading={mutation.isPending}
          serverError={error}
          onSubmit={submit}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}
