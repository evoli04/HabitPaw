import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors, compact) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  content: {
    width: '100%',
    maxWidth: 680,
    alignSelf: 'center',
    paddingHorizontal: compact ? spacing.md : spacing.lg,
    paddingTop: compact ? spacing.sm : spacing.md,
    gap: compact ? spacing.md : spacing.lg,
  },
  greeting: {
    ...typography.title,
    fontSize: compact ? 27 : typography.title.fontSize,
    lineHeight: compact ? 34 : typography.title.lineHeight,
    color: colors.textPrimary,
  },
  date: { ...typography.body, color: colors.textSecondary, textTransform: 'capitalize' },
  catArea: { alignItems: 'center', gap: compact ? spacing.sm : spacing.md, marginVertical: -spacing.sm },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: {
    ...typography.heading,
    fontSize: compact ? 20 : typography.heading.fontSize,
    color: colors.textPrimary,
    flexShrink: 1,
  },
  list: { gap: spacing.sm },
  error: { ...typography.caption, color: colors.danger, textAlign: 'center' },
});
