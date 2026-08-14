import { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../../components/common/AppBackground';
import CatAvatar from '../../components/cat/CatAvatar';
import CoinIcon from '../../components/coins/CoinIcon';
import { useCoins } from '../../contexts/CoinContext';
import { useAppDialog } from '../../contexts/DialogContext';
import { useShop } from '../../contexts/ShopContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './ShopScreen.styles';

export default function ShopScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const cardWidth = Math.floor((width - 2 * 24 - 16) / 2);
  const avatarSize = Math.min(width * 0.72, 320);
  const { balance, ready: coinsReady } = useCoins();
  const { ready, items, equippedItem, equippedItemId, purchaseItem, equipItem, unequipItem } = useShop();
  const { showDialog } = useAppDialog();

  const buyItem = async (item) => {
    if (!ready || !coinsReady) return;
    if (item.owned) {
      try {
        if (equippedItemId === item.id) await unequipItem();
        else await equipItem(item.id);
      } catch (error) {
        showDialog({ title: 'İşlem tamamlanamadı', message: error.message, tone: 'danger' });
      }
      return;
    }
    if (balance < item.price) {
      showDialog({
        title: 'Biraz daha coin lazım',
        message: `${item.name} için ${item.price - balance} coin daha kazanmalısın. Alışkanlıklarını tamamlayarak coin toplayabilirsin.`,
      });
      return;
    }
    showDialog({
      title: `${item.name} satın alınsın mı?`,
      message: `${item.price} coin harcanacak. Kalan bakiyen ${balance - item.price} coin olacak.`,
      actions: [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Satın al',
          onPress: async () => {
            try {
              await purchaseItem(item.id);
              await equipItem(item.id);
              showDialog({ title: 'Paw çok yakışıklı oldu!', message: `${item.name} satın alındı ve kuşanıldı.` });
            } catch (error) {
              showDialog({ title: 'İşlem tamamlanamadı', message: error.message, tone: 'danger' });
            }
          },
        },
      ],
    });
  };

  return (
    <AppBackground>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.balanceCard}>
            <CoinIcon size={32} />
            <View><Text style={styles.balanceLabel}>Coin bakiyen</Text><Text style={styles.balance}>{balance}</Text></View>
          </View>
          <View style={styles.hero}>
            <Text style={styles.heroTitle}>Paw’ın Gardırobu</Text>
            <Text style={styles.heroText}>Alışkanlıklarını tamamla, coin kazan ve Paw’ı süsle.</Text>
            <CatAvatar equippedItem={equippedItem} size={avatarSize} />
            <Text style={styles.equippedLabel}>
              {equippedItem ? `${equippedItem.name} kuşanıldı` : 'Henüz bir aksesuar kuşanılmadı'}
            </Text>
          </View>
          <Text style={styles.sectionTitle}>Aksesuarlar</Text>
          <View style={styles.grid}>
            {items.map((item) => {
              const owned = item.owned;
              const equipped = equippedItemId === item.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${item.name}, ${item.price} coin`}
                  onPress={() => buyItem(item)}
                  style={({ pressed }) => [
                    styles.itemCard,
                    { width: cardWidth },
                    item.premium && styles.premiumCard,
                    equipped && styles.itemCardEquipped,
                    pressed && styles.actionPressed,
                  ]}
                >
                  {item.premium ? <Text style={styles.premiumLabel}>ÖZEL</Text> : null}
                  <View style={styles.itemVisual}>
                    <Image
                      source={item.shopImage}
                      resizeMode="contain"
                      style={[
                        styles.itemImage,
                        {
                          top: item.previewOffsetY ?? 0,
                          transform: [{ scale: item.previewScale ?? 1 }],
                        },
                      ]}
                    />
                  </View>
                  <Text numberOfLines={2} style={styles.itemName}>{item.name}</Text>
                  <Text numberOfLines={2} style={styles.itemDescription}>{item.description}</Text>
                  <View style={styles.priceRow}><CoinIcon size={20} /><Text style={styles.price}>{item.price}</Text></View>
                  <View style={[styles.action, owned && styles.actionOwned, equipped && styles.actionEquipped]}>
                    <Text numberOfLines={1} style={[styles.actionText, owned && styles.actionOwnedText]}>
                      {equipped ? 'Çıkar' : owned ? 'Kuşan' : 'Satın al'}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Text style={styles.footnote}>Aksesuarlar satın alındıktan sonra dilediğin zaman çıkarılıp yeniden kuşanılabilir.</Text>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
