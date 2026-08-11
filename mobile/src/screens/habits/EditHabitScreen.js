import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
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
import { syncHabitReminder } from '../../services/notificationService';
import { useAppDialog } from '../../contexts/DialogContext';

export default function EditHabitScreen({ route, navigation }) {
  const scrollRef = useRef(null);
  const reminderFocused = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { showDialog } = useAppDialog();
  const { id } = route.params;
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const queryClient = useQueryClient();
  const [error, setError] = useState('');

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardDidShow', (event) => {
      setKeyboardHeight(event.endCoordinates.height);
      if (reminderFocused.current) scrollRef.current?.scrollToEnd({ animated: true });
    });
    const hideSubscription = Keyboard.addListener('keyboardDidHide', () => setKeyboardHeight(0));
    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  const query = useQuery({ queryKey: ['habits', id], queryFn: () => getHabitById(id) });
  const mutation = useMutation({
    mutationFn: (payload) => updateHabit(id, payload),
    onSuccess: async (habit) => {
      queryClient.setQueryData(['habits', id], habit);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['habits', 'today'] }),
      ]);
      await syncHabitReminder(habit).catch((reason) => setError(reason.message));
      showDialog({ title: 'Güncellendi', message: 'Alışkanlığındaki değişiklikler kaydedildi.', actions: [
        { text: 'Tamam', onPress: navigation.goBack },
      ] });
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
      showDialog({
        title: 'Hatırlatma korunacak',
        message: 'Backend mevcut hatırlatmayı kaldırmayı desteklemiyor. Kayıtlı saat değiştirilmeden bırakılacak.',
        actions: [{ text: 'Anladım', onPress: () => mutation.mutate(payload) }],
      });
      return;
    }
    mutation.mutate(payload);
  };

  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={80}
      >
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(keyboardHeight, 80) + 80 }]}
      >
        <Text style={styles.description}>Yalnızca değiştirmek istediğin bilgileri düzenle.</Text>
        <HabitForm
          defaultValues={{ ...query.data, reminderTime: reminder }}
          existingReminder={reminder}
          submitTitle="Değişiklikleri kaydet"
          loading={mutation.isPending}
          serverError={error}
          onSubmit={submit}
          onReminderFocus={() => {
            reminderFocused.current = true;
            scrollRef.current?.scrollToEnd({ animated: true });
          }}
          onReminderBlur={() => { reminderFocused.current = false; }}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}
