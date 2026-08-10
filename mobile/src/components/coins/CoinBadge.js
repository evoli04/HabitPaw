import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCoins } from '../../contexts/CoinContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import CoinIcon from './CoinIcon';

export default function CoinBadge() {
  const { balance } = useCoins();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.badge, { top: insets.top + 12 }]}>
      <CoinIcon size={25} />
      <Text style={styles.value}>{balance}</Text>
    </View>
  );
}

const createStyles = (colors) => StyleSheet.create({
  badge: {
    position: 'absolute',
    right: 18,
    zIndex: 30,
    minWidth: 74,
    height: 40,
    paddingHorizontal: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 7,
  },
  value: { color: colors.textPrimary, fontSize: 16, fontWeight: '900' },
});
