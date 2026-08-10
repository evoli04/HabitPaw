import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors) => StyleSheet.create({
  full: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: 'transparent',
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    padding: spacing.xl,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: { ...typography.heading, color: colors.textPrimary, textAlign: 'center' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
});
