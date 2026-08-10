import { useMemo } from 'react';
import { Text, View } from 'react-native';
import AppButton from './AppButton';
import CatCharacter from '../cat/CatCharacter';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './StateViews.styles';

export default function EmptyState({ title, message, actionTitle, onAction }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.card}>
      <CatCharacter mood="neutral" size="small" animated={false} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onAction ? <AppButton title={actionTitle} onPress={onAction} /> : null}
    </View>
  );
}
