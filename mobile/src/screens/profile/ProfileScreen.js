import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import CatCharacter from '../../components/cat/CatCharacter';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './ProfileScreen.styles';
import { useAppDialog } from '../../contexts/DialogContext';
import { getProfile } from '../../services/profileService';
import { getDisplayName } from '../../utils/displayName';

const THEME_OPTIONS = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
];

export default function ProfileScreen() {
  const { showDialog } = useAppDialog();
  const { user, signOut } = useAuth();
  const { colors, preference, setThemePreference } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const displayName = getDisplayName(user, profileQuery.data);

  const logout = async () => {
    setLoading(true);
    try {
      await signOut();
    } catch (error) {
      showDialog({ title: 'Çıkış yapılamadı', message: error.message, tone: 'danger' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppBackground>
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <CatCharacter mood="happy" size="small" />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email || 'E-posta bulunamadı'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Profil bilgileri</Text>
          <Text style={styles.infoText}>
            Profil düzenleme özelliği backend desteği tamamlandığında kullanıma açılacak.
          </Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Tema</Text>
          <Text style={styles.infoText}>Uygulamanın görünümünü seç.</Text>
          <View accessibilityRole="radiogroup" style={styles.themeOptions}>
            {THEME_OPTIONS.map((option) => {
              const selected = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  accessibilityRole="radio"
                  accessibilityLabel={`${option.label} tema`}
                  accessibilityState={{ selected, checked: selected }}
                  onPress={() => setThemePreference(option.value)}
                  style={({ pressed }) => [
                    styles.themeOption,
                    selected && styles.themeOptionSelected,
                    pressed && { opacity: 0.78 },
                  ]}
                >
                  <View style={[styles.radio, selected && styles.radioSelected]}>
                    {selected ? <View style={styles.radioDot} /> : null}
                  </View>
                  <Text style={[styles.themeOptionText, selected && styles.themeOptionTextSelected]}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        <AppButton title="Çıkış yap" variant="danger" loading={loading} onPress={logout} />
      </ScrollView>
    </SafeAreaView>
    </AppBackground>
  );
}
