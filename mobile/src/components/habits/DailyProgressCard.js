import { useMemo } from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './DailyProgressCard.styles';

export default function DailyProgressCard({ completed, total }) {
  const percent = total ? Math.round((completed / total) * 100) : 0;
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, width < 360), [colors, width]);
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text style={styles.label}>Günlük ilerleme</Text>
          <Text style={styles.count}>{completed} / {total} tamamlandı</Text>
        </View>
        <Text style={styles.percent}>%{percent}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%` }]} />
      </View>
    </View>
  );
}
