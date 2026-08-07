import { useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './AppButton.styles';

export default function AppButton({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  accessibilityLabel,
  icon,
  style,
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const unavailable = disabled || loading;
  const secondaryContentColor =
    variant === 'outline' || variant === 'ghost'
      ? colors.primary
      : variant === 'secondary'
        ? colors.textPrimary
        : colors.white;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      disabled={unavailable}
      onPress={onPress}
      style={({ pressed }) => [
        styles.touchable,
        variant !== 'primary' && styles[variant],
        unavailable && styles.disabled,
        pressed && !unavailable && styles.pressed,
        style,
      ]}
    >
      {variant === 'primary' && !unavailable ? (
        <LinearGradient
          colors={[colors.primary, colors.primaryEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.base}
        >
          {loading ? <ActivityIndicator color={colors.white} /> : (
            <>
              {icon ? <Ionicons name={icon} size={20} color={colors.white} /> : null}
              <Text style={styles.text}>{title}</Text>
            </>
          )}
        </LinearGradient>
      ) : (
        <View style={styles.base}>
          {loading ? (
            <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.white} />
          ) : (
            <>
              {icon ? <Ionicons name={icon} size={20} color={secondaryContentColor} /> : null}
              <Text style={[styles.text, styles[`${variant}Text`]]}>{title}</Text>
            </>
          )}
        </View>
      )}
    </Pressable>
  );
}
