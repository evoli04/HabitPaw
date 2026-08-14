import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../../components/common/AppButton';
import AppBackground from '../../components/common/AppBackground';
import CatAvatar from '../../components/cat/CatAvatar';
import { useAuth } from '../../hooks/useAuth';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './ProfileScreen.styles';
import { useAppDialog } from '../../contexts/DialogContext';
import { getProfile } from '../../services/profileService';
import { getDisplayName } from '../../utils/displayName';
import { Ionicons } from '@expo/vector-icons';
import CoinIcon from '../../components/coins/CoinIcon';
import { ROUTES } from '../../constants/routes';
import { useCoins } from '../../contexts/CoinContext';
import { useShop } from '../../contexts/ShopContext';

const THEME_OPTIONS = [
  { value: 'system', label: 'Sistem' },
  { value: 'light', label: 'Açık' },
  { value: 'dark', label: 'Koyu' },
];

export default function ProfileScreen({ navigation }) {
  const { showDialog } = useAppDialog();
  const { user, signOut } = useAuth();
  const { colors, preference, setThemePreference } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [loading, setLoading] = useState(false);
  const profileQuery = useQuery({ queryKey: ['profile'], queryFn: getProfile });
  const displayName = getDisplayName(user, profileQuery.data);
  const { balance } = useCoins();
  const { equippedItem } = useShop();

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
          <CatAvatar equippedItem={equippedItem} size={96} />
          <Text style={styles.name}>{displayName}</Text>
          <Text style={styles.email}>{user?.email || 'E-posta bulunamadı'}</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.infoTitle}>Profil bilgileri</Text>
          <Text style={styles.infoText}>
            Profil düzenleme özelliği backend desteği tamamlandığında kullanıma açılacak.
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Paw mağazasını aç"
          onPress={() => navigation.navigate(ROUTES.SHOP)}
          style={({ pressed }) => [styles.shopCard, pressed && { opacity: 0.78 }]}
        >
          <View style={styles.shopIcon}><Ionicons name="shirt-outline" size={28} color={colors.primary} /></View>
          <View style={styles.shopCopy}>
            <Text style={styles.shopTitle}>Paw Mağazası</Text>
            <Text style={styles.shopText}>Coinlerinle kedine aksesuar al.</Text>
          </View>
          <View style={styles.shopBalance}><CoinIcon size={24} /><Text style={styles.shopBalanceText}>{balance}</Text></View>
          <Ionicons name="chevron-forward" size={22} color={colors.textSecondary} />
        </Pressable>
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
