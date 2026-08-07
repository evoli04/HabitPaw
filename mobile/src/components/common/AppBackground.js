import { memo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { styles } from './AppBackground.styles';

function AppBackground({ children, plain = false }) {
  const { colors } = useAppTheme();
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {plain ? (
        <View style={[styles.plain, { backgroundColor: colors.background }]} />
      ) : (
        <LinearGradient
          colors={[colors.background, colors.backgroundEnd]}
          locations={[0.25, 1]}
          style={styles.gradient}
        />
      )}
      <Ionicons name="paw" size={96} color={colors.primary} style={styles.pawTop} />
      <Ionicons name="paw" size={72} color={colors.secondary} style={styles.pawBottom} />
      {children}
    </View>
  );
}

export default memo(AppBackground);
