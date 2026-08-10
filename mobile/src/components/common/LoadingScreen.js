import { useMemo } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './StateViews.styles';
import AppBackground from './AppBackground';

export default function LoadingScreen({ message = 'Yükleniyor…' }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <AppBackground>
      <View style={styles.full}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.message}>{message}</Text>
      </View>
    </AppBackground>
  );
}
