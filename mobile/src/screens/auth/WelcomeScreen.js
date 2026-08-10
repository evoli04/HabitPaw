import { ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import CatCharacter from '../../components/cat/CatCharacter';
import { ROUTES } from '../../constants/routes';
import { styles } from './WelcomeScreen.styles';

export default function WelcomeScreen({ navigation }) {
  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <CatCharacter mood="happy" />
          <Text style={styles.title}>HabitPaw</Text>
          <Text style={styles.slogan}>Küçük alışkanlıklar, büyük değişimler.</Text>
          <Text style={styles.description}>
            Günlük rutinlerini Paw ile takip et, hedeflerine küçük ama kararlı adımlarla ulaş.
          </Text>
        </View>
        <View style={styles.actions}>
          <AppButton title="Başlayalım" onPress={() => navigation.navigate(ROUTES.REGISTER)} />
          <AppButton
            title="Zaten hesabım var"
            variant="ghost"
            onPress={() => navigation.navigate(ROUTES.LOGIN)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}
