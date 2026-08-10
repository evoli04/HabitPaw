import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import HabitForm from '../../components/habits/HabitForm';
import AppBackground from '../../components/common/AppBackground';
import { createHabit } from '../../services/habitService';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './HabitFormScreen.styles';

export default function AddHabitScreen({ navigation }) {
  const queryClient = useQueryClient();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [error, setError] = useState('');
  const mutation = useMutation({
    mutationFn: createHabit,
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['habits'] }),
        queryClient.invalidateQueries({ queryKey: ['habits', 'today'] }),
      ]);
      Alert.alert('Hazır!', 'Yeni alışkanlığın oluşturuldu.', [
        { text: 'Tamam', onPress: navigation.goBack },
      ]);
    },
    onError: (reason) => setError(reason.message),
  });

  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
        <Text style={styles.description}>Takip etmek istediğin küçük adımı tanımla.</Text>
        <HabitForm
          submitTitle="Alışkanlık oluştur"
          loading={mutation.isPending}
          serverError={error}
          onSubmit={(payload) => {
            setError('');
            mutation.mutate(payload);
          }}
        />
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}
