import { StyleSheet } from 'react-native';
export const styles = StyleSheet.create({
  root: { flex: 1 },
  gradient: { ...StyleSheet.absoluteFillObject },
  plain: { ...StyleSheet.absoluteFillObject },
  pawTop: {
    position: 'absolute',
    top: 90,
    right: -24,
    opacity: 0.03,
    transform: [{ rotate: '-24deg' }],
  },
  pawBottom: {
    position: 'absolute',
    bottom: 120,
    left: -16,
    opacity: 0.03,
    transform: [{ rotate: '20deg' }],
  },
});
