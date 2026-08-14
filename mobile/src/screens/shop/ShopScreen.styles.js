import { StyleSheet } from 'react-native';
import { radii, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';

export const createStyles = (colors) => StyleSheet.create({
  safeArea: { flex: 1 },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  balanceCard: { alignSelf: 'flex-end', flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radii.round, backgroundColor: colors.surfaceElevated, borderWidth: 1, borderColor: colors.border },
  balanceLabel: { ...typography.caption, color: colors.textSecondary },
  balance: { ...typography.heading, color: colors.textPrimary, lineHeight: 24 },
  hero: { alignItems: 'center', padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  heroTitle: { ...typography.title, fontSize: 27, color: colors.textPrimary, textAlign: 'center' },
  heroText: { ...typography.body, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.xs },
  equippedLabel: { ...typography.label, color: colors.primary, marginTop: spacing.xs },
  sectionTitle: { ...typography.heading, color: colors.textPrimary },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  itemCard: { minHeight: 282, padding: spacing.md, borderRadius: radii.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  itemCardEquipped: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  premiumCard: { borderColor: colors.accent, borderWidth: 2 },
  premiumLabel: { ...typography.caption, color: '#9A6500', fontWeight: '800', textAlign: 'center', marginBottom: spacing.xs },
  itemVisual: { width: '100%', height: 112, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', borderRadius: radii.md, backgroundColor: colors.primaryLight },
  itemImage: { width: '94%', height: '94%' },
  itemName: { ...typography.subtitle, color: colors.textPrimary, textAlign: 'center', marginTop: spacing.sm, minHeight: 50 },
  itemDescription: { ...typography.caption, color: colors.textSecondary, textAlign: 'center', minHeight: 36, flexGrow: 1 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginTop: spacing.sm },
  price: { ...typography.subtitle, color: colors.textPrimary },
  action: { width: '100%', minHeight: 40, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sm, borderRadius: radii.md, backgroundColor: colors.primary },
  actionOwned: { backgroundColor: colors.primaryLight, borderWidth: 1, borderColor: colors.primary },
  actionEquipped: { backgroundColor: colors.surfaceElevated },
  actionPressed: { opacity: 0.75 },
  actionText: { ...typography.label, color: colors.white },
  actionOwnedText: { color: colors.primary },
  footnote: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
