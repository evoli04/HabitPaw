import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors) => StyleSheet.create({
  container: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textPrimary },
  inputRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.inputBackground,
  },
  multilineRow: { alignItems: 'flex-start', minHeight: 112 },
  input: {
    ...typography.body,
    flex: 1,
    color: colors.textPrimary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  multiline: { minHeight: 108, textAlignVertical: 'top' },
  eyeButton: { minWidth: 48, minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  errorBorder: { borderColor: colors.danger },
  error: { ...typography.caption, color: colors.danger },
});
