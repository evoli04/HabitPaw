import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors, isDark) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  content: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xl,
  },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  title: { ...typography.hero, color: colors.primary },
  slogan: { ...typography.heading, color: isDark ? colors.white : colors.textPrimary, textAlign: 'center' },
  description: { ...typography.body, color: isDark ? colors.white : colors.textSecondary, textAlign: 'center' },
  actions: { gap: spacing.sm },
});
