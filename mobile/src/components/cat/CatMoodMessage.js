import { useMemo } from 'react';
import { Text } from 'react-native';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './CatMoodMessage.styles';

const messages = {
  sad: 'Bugün birlikte başlayalım.',
  sleepy: 'Güzel başladın, küçük adımlar devam.',
  neutral: 'Her adım seni hedeflerine yaklaştırıyor.',
  happy: 'Harika gidiyorsun!',
  excited: 'Muhteşemsin! Bugünün hedefleri tamam.',
};

export default function CatMoodMessage({ mood }) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  return <Text style={styles.text}>{messages[mood] ?? messages.neutral}</Text>;
}
