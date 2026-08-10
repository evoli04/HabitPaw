import { memo, useEffect, useMemo, useRef } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Animated, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { getFrequencyLabel } from '../../constants/habits';
import { useAppTheme } from '../../hooks/useAppTheme';
import { formatReminderTime } from '../../utils/timeUtils';
import { createStyles } from './HabitCard.styles';

function HabitCard({ habit, onPress, onToggle, toggling = false }) {
  const time = formatReminderTime(habit.reminderTime);
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors, width < 360), [colors, width]);
  const checkScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!habit.completedToday) {
      checkScale.setValue(1);
      return undefined;
    }

    const animation = Animated.sequence([
      Animated.timing(checkScale, { toValue: 0.8, duration: 80, useNativeDriver: true }),
      Animated.spring(checkScale, {
        toValue: 1.1,
        friction: 5,
        tension: 140,
        useNativeDriver: true,
      }),
      Animated.spring(checkScale, {
        toValue: 1,
        friction: 6,
        tension: 120,
        useNativeDriver: true,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [checkScale, habit.completedToday]);

  return (
    <View style={styles.animatedCard}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${habit.title} alışkanlığı`}
        disabled={!onPress}
        onPress={onPress}
        style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      >
        {onToggle ? (
          <Animated.View style={[styles.checkTouch, { transform: [{ scale: checkScale }] }]}>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: Boolean(habit.completedToday) }}
              accessibilityLabel={`${habit.title} tamamlandı olarak işaretle`}
              disabled={toggling}
              hitSlop={8}
              onPress={onToggle}
              style={styles.checkTouch}
            >
              <View style={[styles.check, habit.completedToday && styles.checked]}>
                {toggling ? (
                  <ActivityIndicator size="small" color={habit.completedToday ? colors.white : colors.primary} />
                ) : habit.completedToday ? (
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                ) : null}
              </View>
            </Pressable>
          </Animated.View>
        ) : (
          <View style={styles.icon}>
            <Ionicons name="paw-outline" size={24} color={colors.primary} />
          </View>
        )}
        <View style={styles.content}>
          <Text style={[styles.title, habit.completedToday && styles.completed]} numberOfLines={2}>
            {habit.title}
          </Text>
          {habit.description ? (
            <Text style={styles.description} numberOfLines={2}>
              {habit.description}
            </Text>
          ) : null}
          <Text style={styles.meta}>
            {getFrequencyLabel(habit.frequency)}
            {time ? ` • ${time}` : ''}
            {habit.isActive === false ? ' • Pasif' : ''}
          </Text>
        </View>
        {onPress ? <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} /> : null}
      </Pressable>
    </View>
  );
}

export default memo(HabitCard);
