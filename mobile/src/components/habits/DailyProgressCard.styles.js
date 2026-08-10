import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

export const createStyles = (colors, compact) => StyleSheet.create({
  card: {
    ...shadows.card,
    shadowColor: colors.shadow,
    gap: spacing.md,
    paddingHorizontal: compact ? spacing.md : spacing.lg,
    paddingVertical: compact ? 14 : spacing.md,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  copy: { flex: 1 },
  label: { ...typography.subtitle, color: colors.textPrimary },
  count: { ...typography.caption, color: colors.textSecondary },
  percent: { ...typography.heading, color: colors.primary },
  track: { height: 8, borderRadius: 4, backgroundColor: colors.progressTrack, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: colors.primary },
});
