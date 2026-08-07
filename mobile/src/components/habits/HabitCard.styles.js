import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

export const createStyles = (colors, compact) => StyleSheet.create({
  animatedCard: { borderRadius: 20 },
  card: {
    ...shadows.card,
    shadowColor: colors.shadow,
    minHeight: compact ? 84 : 92,
    flexDirection: 'row',
    alignItems: 'center',
    gap: compact ? spacing.sm : spacing.md,
    paddingHorizontal: compact ? spacing.md : 18,
    paddingVertical: compact ? 12 : 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  pressed: { opacity: 0.8 },
  checkTouch: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: { backgroundColor: colors.success, borderColor: colors.success },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
  },
  content: { flex: 1, gap: 2, minWidth: 0 },
  title: { ...typography.body, fontWeight: '700', color: colors.textPrimary },
  completed: { textDecorationLine: 'line-through', color: colors.textSecondary },
  description: { ...typography.caption, color: colors.textSecondary },
  meta: { ...typography.caption, color: colors.primary },
});
