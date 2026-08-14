import { useEffect, useMemo, useRef } from 'react';
import { ActivityIndicator, Animated, Image, Modal, Pressable, Text, View } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './CelebrationPopup.styles';
import CoinIcon from '../coins/CoinIcon';
import { getCatImage } from '../../constants/catImages';

export default function CelebrationPopup({ visible, habitTitle, reward, claiming, onClaim, onClose }) {
  const { colors, isDark } = useAppTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.72)).current;
  const translateY = useRef(new Animated.Value(24)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return undefined;

    opacity.setValue(0);
    scale.setValue(0.72);
    translateY.setValue(24);
    rotate.setValue(0);

    const entrance = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 6, tension: 70, useNativeDriver: true }),
    ]);
    const celebration = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(translateY, { toValue: -10, duration: 320, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 1, duration: 320, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(translateY, { toValue: 0, duration: 320, useNativeDriver: true }),
          Animated.timing(rotate, { toValue: 0, duration: 320, useNativeDriver: true }),
        ]),
      ]),
    );

    entrance.start(({ finished }) => {
      if (finished) celebration.start();
    });
    return () => {
      entrance.stop();
      celebration.stop();
    };
  }, [opacity, rotate, scale, translateY, visible]);

  const rotation = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['-2deg', '2deg'],
  });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Animated.View style={[styles.card, { opacity, transform: [{ translateY }, { scale }] }]}>
          <Text style={[styles.confetti, styles.confettiLeft]}>✦</Text>
          <Text style={[styles.confetti, styles.confettiRight]}>★</Text>
          <Text style={[styles.confetti, styles.confettiTop]}>✧</Text>
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Image
              source={getCatImage('excited')}
              resizeMode="contain"
              style={styles.cat}
            />
          </Animated.View>
          <View style={styles.copy}>
            <Text style={styles.title}>Harika iş! 🎉</Text>
            <Text numberOfLines={2} style={styles.message}>
              {habitTitle ? `“${habitTitle}” tamamlandı.` : 'Alışkanlığını tamamladın.'}
            </Text>
            <Text style={styles.hint}>Paw seninle gurur duyuyor!</Text>
            <Pressable
              accessibilityRole="button"
              disabled={claiming}
              onPress={onClaim}
              style={({ pressed }) => [styles.claimButton, pressed && styles.claimButtonPressed]}
            >
              {claiming ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <>
                  <CoinIcon size={30} />
                  <Text style={styles.claimButtonText}>{reward} Coin Al</Text>
                </>
              )}
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
