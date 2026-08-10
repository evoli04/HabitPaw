import { StyleSheet } from 'react-native';
import { typography } from '../../theme/typography';

export const createStyles = (colors) => StyleSheet.create({
  text: { ...typography.subtitle, color: colors.textPrimary, textAlign: 'center' },
});
