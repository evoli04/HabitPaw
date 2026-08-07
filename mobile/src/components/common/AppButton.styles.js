import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors) => StyleSheet.create({
  touchable: {
    minHeight: 56,
    borderRadius: radii.md,
    overflow: 'hidden',
  },
  base: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  secondary: { backgroundColor: colors.secondary },
  danger: { backgroundColor: colors.danger },
  outline: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.primary },
  ghost: { backgroundColor: 'transparent' },
  disabled: { backgroundColor: colors.disabled, borderColor: colors.disabled },
  pressed: { opacity: 0.88, transform: [{ scale: 0.985 }] },
  text: { ...typography.label, color: colors.white, textAlign: 'center' },
  primaryText: { color: colors.white },
  secondaryText: { color: colors.textPrimary },
  dangerText: { color: colors.white },
  outlineText: { color: colors.primary },
  ghostText: { color: colors.primary },
});
