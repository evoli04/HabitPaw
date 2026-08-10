import { memo, useEffect, useRef } from 'react';
import { Animated, Image, Text, useWindowDimensions, View } from 'react-native';
import { styles } from './CatCharacter.styles';

const moodImages = {
  neutral: require('../../../assets/cats/cat.png'),
  sad: require('../../../assets/cats/sadcat.png'),
  sleepy: require('../../../assets/cats/sleepingcat.png'),
  happy: require('../../../assets/cats/happycat.png'),
  excited: require('../../../assets/cats/celebratingcat.png'),
};

function CatCharacter({ mood = 'neutral', size = 'large', animated = true, prominent = false }) {
  const isSmall = size === 'small';
  const { width, height } = useWindowDimensions();
  const responsiveSize = prominent
    ? Math.min(width * 0.92, height * 0.42, 390)
    : Math.min(width * 0.68, 300);
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!animated) {
      translateY.setValue(0);
      scale.setValue(1);
      return undefined;
    }

    const floatingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -5,
          duration: 2100,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 2100,
          useNativeDriver: true,
        }),
      ]),
    );

    const breathingAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 1900,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1900,
          useNativeDriver: true,
        }),
      ]),
    );

    const animation = Animated.parallel([floatingAnimation, breathingAnimation]);
    animation.start();

    return () => {
      animation.stop();
      translateY.stopAnimation();
      scale.stopAnimation();
    };
  }, [animated, scale, translateY]);

  return (
    <View
      style={[
        styles.stage,
        isSmall
          ? styles.smallStage
          : { width: responsiveSize + 12, height: responsiveSize + 12 },
      ]}
    >
      {(mood === 'happy' || mood === 'excited') && !isSmall ? (
        <>
          <Text style={[styles.star, styles.starLeft]}>✦</Text>
          <Text style={[styles.star, styles.starRight]}>✦</Text>
          <Text style={[styles.star, styles.starTop]}>✧</Text>
        </>
      ) : null}
      <Animated.View style={{ transform: [{ translateY }, { scale }] }}>
        <Image
          accessibilityRole="image"
          accessibilityLabel={`HabitPaw kedisi: ${mood}`}
          source={moodImages[mood] || moodImages.neutral}
          resizeMode="contain"
          style={[
            styles.image,
            isSmall
              ? styles.smallImage
              : { width: responsiveSize, height: responsiveSize },
          ]}
        />
      </Animated.View>
    </View>
  );
}

export default memo(CatCharacter);
