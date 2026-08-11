import { useEffect, useMemo, useRef, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitForm from '../../components/habits/HabitForm';
import AppBackground from '../../components/common/AppBackground';
import { createHabit } from '../../services/habitService';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './HabitFormScreen.styles';
import { syncHabitReminder } from '../../services/notificationService';
import { useAppDialog } from '../../contexts/DialogContext';

export default function AddHabitScreen({ navigation }) {
  const scrollRef = useRef(null);
  const reminderFocused = useRef(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const { showDialog } = useAppDialog();
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
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
  const mutation = useMutation({
    mutationFn: createHabit,
    onSuccess: async (habit) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['habits', 'today'] }),
      ]);
      await syncHabitReminder(habit).catch((reason) => setError(reason.message));
      showDialog({ title: 'Hazır!', message: 'Yeni alışkanlığın oluşturuldu.', actions: [
        { text: 'Tamam', onPress: navigation.goBack },
      ] });
    },
    onError: (reason) => setError(reason.message),
  });

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
        <Text style={styles.description}>Takip etmek istediğin küçük adımı tanımla.</Text>
        <HabitForm
          submitTitle="Alışkanlık oluştur"
          loading={mutation.isPending}
          serverError={error}
          onSubmit={(payload) => {
            setError('');
            mutation.mutate(payload);
          }}
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
