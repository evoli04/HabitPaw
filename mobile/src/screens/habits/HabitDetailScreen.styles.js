import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import { shadows } from '../../theme/shadows';

export const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  hero: { alignItems: 'center', gap: spacing.sm },
  paw: { fontSize: 58 },
  title: { ...typography.title, color: colors.textPrimary, textAlign: 'center' },
  status: {
    ...typography.caption,
    color: colors.success,
    backgroundColor: '#E8F8EF',
    borderRadius: radii.round,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  card: {
    ...shadows.card,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { gap: spacing.xs, paddingBottom: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border },
  label: { ...typography.caption, color: colors.textSecondary },
  value: { ...typography.body, color: colors.textPrimary },
  actions: { gap: spacing.sm },
});
