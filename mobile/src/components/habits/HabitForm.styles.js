import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors) => StyleSheet.create({
  form: {
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  group: { gap: spacing.sm },
  label: { ...typography.label, color: colors.textPrimary },
  frequencyRow: { flexDirection: 'row', gap: spacing.sm },
  frequency: {
    flex: 1,
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.inputBackground,
  },
  frequencySelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  frequencyText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
  frequencyTextSelected: { color: colors.primary, fontWeight: '700' },
  error: { ...typography.caption, color: colors.danger },
});
