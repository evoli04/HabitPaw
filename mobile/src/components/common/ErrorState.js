import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import AppButton from './AppButton';
import { createStyles } from './StateViews.styles';

export default function ErrorState({ message, onRetry }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <Ionicons name="cloud-offline-outline" size={38} color={colors.danger} />
      <Text style={styles.title}>Bir şeyler ters gitti</Text>
      <Text style={styles.message}>{message || 'İşlem tamamlanamadı.'}</Text>
      {onRetry ? <AppButton title="Tekrar dene" onPress={onRetry} variant="outline" /> : null}
    </View>
  );
}
