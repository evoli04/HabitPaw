import { memo, useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet } from 'react-native';
import { getCatImage } from '../../constants/catImages';

function CatAvatar({ equippedItem = null, size = 280, animated = true, style }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!animated) {
      translateY.setValue(0);
      return undefined;
    }
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, { toValue: -4, duration: 1800, useNativeDriver: true }),
        Animated.timing(translateY, { toValue: 0, duration: 1800, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [animated, translateY]);

  return (
    <Animated.View style={[styles.animationWrapper, { transform: [{ translateY }] }, style]}>
      <Image
        accessibilityRole="image"
        accessibilityLabel="HabitPaw kedisi"
        source={getCatImage('happy', equippedItem?.id)}
        resizeMode="contain"
        style={{ width: size, height: size }}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  animationWrapper: { alignItems: 'center', justifyContent: 'center' },
});

export default memo(CatAvatar);
