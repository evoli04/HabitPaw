import { StyleSheet } from 'react-native';
import { colors } from '../../theme/colors';

export const styles = StyleSheet.create({
  stage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallStage: { width: 96, height: 96 },
  image: {
    borderRadius: 42,
  },
  smallImage: {
    width: 88,
    height: 88,
    borderRadius: 24,
  },
  star: {
    position: 'absolute',
    zIndex: 2,
    color: colors.accent,
    fontSize: 28,
    textShadowColor: 'rgba(255, 209, 102, 0.35)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 8,
  },
  starLeft: { left: 6, top: 92 },
  starRight: { right: 8, top: 122 },
  starTop: { right: 52, top: 24, fontSize: 22 },
});
