import { StyleSheet } from 'react-native';
import { spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors, isDark) => StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: 'transparent' },
  content: { padding: spacing.lg, gap: spacing.xl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...typography.title, color: isDark ? colors.white : colors.textPrimary },
  subtitle: { ...typography.body, color: isDark ? colors.white : colors.textSecondary },
  list: { gap: spacing.sm },
});
