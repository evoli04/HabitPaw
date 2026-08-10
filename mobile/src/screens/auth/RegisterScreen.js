import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import AppInput from '../../components/common/AppInput';
import CatCharacter from '../../components/cat/CatCharacter';
import { ROUTES } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';
import { styles } from './RegisterScreen.styles';
import { useAppDialog } from '../../contexts/DialogContext';

const schema = z
  .object({
    name: z.string().trim().min(1, 'Ad soyad zorunludur.'),
    email: z.string().trim().email('Geçerli bir e-posta adresi girin.'),
    password: z.string().min(8, 'Şifre en az 8 karakter olmalıdır.'),
    confirmPassword: z.string().min(1, 'Şifrenizi tekrar girin.'),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: 'Şifreler eşleşmiyor.',
    path: ['confirmPassword'],
  });

export default function RegisterScreen({ navigation }) {
  const { showDialog } = useAppDialog();
  const { signUp, configurationError } = useAuth();
  const [formError, setFormError] = useState('');
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  });

  const submit = async ({ confirmPassword: _confirmPassword, ...values }) => {
    setFormError('');
    try {
      const result = await signUp(values);
      if (!result.session) {
        showDialog({
          title: 'E-postanı doğrula',
          message: 'Kaydın oluşturuldu. Devam etmek için e-postana gönderilen doğrulama bağlantısını aç.',
          actions: [{ text: 'Tamam', onPress: () => navigation.navigate(ROUTES.LOGIN) }],
        });
      }
    } catch (error) {
      setFormError(error.message);
    }
  };

  const field = (name, props) => (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value } }) => (
        <AppInput
          {...props}
          onBlur={onBlur}
          onChangeText={onChange}
          value={value}
          error={errors[name]?.message}
        />
      )}
    />
  );

  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.content}>
          <View style={styles.hero}>
            <CatCharacter mood="neutral" size="small" />
            <Text style={styles.title}>HabitPaw’a katıl</Text>
            <Text style={styles.subtitle}>İlk küçük adımın bugün başlasın.</Text>
          </View>
          <View style={styles.glassCard}>
            {field('name', { label: 'Ad soyad', placeholder: 'Adınız Soyadınız', autoComplete: 'name' })}
            {field('email', {
              label: 'E-posta',
              placeholder: 'ornek@eposta.com',
              keyboardType: 'email-address',
              autoCapitalize: 'none',
              autoComplete: 'email',
            })}
            {field('password', {
              label: 'Şifre',
              placeholder: 'En az 8 karakter',
              secureTextEntry: true,
              autoComplete: 'new-password',
            })}
            {field('confirmPassword', {
              label: 'Şifre tekrar',
              placeholder: 'Şifrenizi tekrar girin',
              secureTextEntry: true,
            })}
            {configurationError || formError ? (
              <Text accessibilityRole="alert" style={styles.error}>{configurationError || formError}</Text>
            ) : null}
            <AppButton title="Kayıt ol" loading={isSubmitting} onPress={handleSubmit(submit)} />
            <AppButton
              title="Zaten hesabım var"
              variant="ghost"
              onPress={() => navigation.navigate(ROUTES.LOGIN)}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
    </AppBackground>
  );
}
