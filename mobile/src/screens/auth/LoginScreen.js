import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import AppInput from '../../components/common/AppInput';
import CatCharacter from '../../components/cat/CatCharacter';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { styles } from './LoginScreen.styles';

const schema = z.object({
  email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
  password: z.string().min(1, 'Şifrenizi girin.'),
});

export default function LoginScreen({ navigation }) {
  const { signIn, configurationError } = useAuth();
  const [formError, setFormError] = useState('');
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { email: '', password: '' } });

  const submit = async (values) => {
    setFormError('');
    try {
      await signIn(values);
    } catch (error) {
      setFormError(error.message);
    }
  };

  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
            <View style={styles.hero}>
              <CatCharacter mood="happy" />
              <Text style={styles.title}>Tekrar hoş geldin</Text>
              <Text style={styles.subtitle}>Paw seni ve alışkanlıklarını özledi.</Text>
            </View>
            <View style={styles.glassCard}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="E-posta"
                    placeholder="ornek@eposta.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.email?.message}
                  />
                )}
              />
              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <AppInput
                    label="Şifre"
                    placeholder="Şifreniz"
                    secureTextEntry
                    autoComplete="password"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    error={errors.password?.message}
                  />
                )}
              />
              {configurationError || formError ? (
                <Text accessibilityRole="alert" style={styles.error}>{configurationError || formError}</Text>
              ) : null}
              <AppButton
                title="Giriş yap"
                loading={isSubmitting}
                onPress={handleSubmit(submit)}
              />
              <AppButton
                title="Hesap oluştur"
                variant="ghost"
                onPress={() => navigation.navigate(ROUTES.REGISTER)}
              />
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}
