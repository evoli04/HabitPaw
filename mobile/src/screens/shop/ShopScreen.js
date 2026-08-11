import { useMemo } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppBackground from '../../components/common/AppBackground';
import CatCharacter from '../../components/cat/CatCharacter';
import CoinIcon from '../../components/coins/CoinIcon';
import { SHOP_ITEMS } from '../../constants/shopItems';
import { useCoins } from '../../contexts/CoinContext';
import { useAppDialog } from '../../contexts/DialogContext';
import { useShop } from '../../contexts/ShopContext';
import { useAppTheme } from '../../hooks/useAppTheme';
import { createStyles } from './ShopScreen.styles';

export default function ShopScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { balance, ready: coinsReady, spendCoins } = useCoins();
  const { ready, ownedItemIds, equippedItemId, unlockItem, equipItem, unequipItem } = useShop();
  const { showDialog } = useAppDialog();
  const equippedItem = SHOP_ITEMS.find((item) => item.id === equippedItemId);

  const buyItem = (item) => {
    if (!ready || !coinsReady) return;
    if (ownedItemIds.includes(item.id)) {
      if (equippedItemId === item.id) unequipItem();
      else equipItem(item.id);
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
            const paid = await spendCoins(item.price);
            if (!paid) return;
            await unlockItem(item.id);
            await equipItem(item.id);
            showDialog({ title: 'Paw çok yakışıklı oldu!', message: `${item.name} satın alındı ve kuşanıldı.` });
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
            <View style={styles.catStage}>
              <CatCharacter mood="happy" size="small" />
              {equippedItem ? (
                <Image
                  source={equippedItem.image}
                  resizeMode="contain"
                  style={[styles.equippedPreview, equippedItem.previewStyle]}
                />
              ) : null}
            </View>
            <Text style={styles.equippedLabel}>{equippedItem ? `${equippedItem.name} kuşanıldı` : 'Henüz bir aksesuar kuşanılmadı'}</Text>
          </View>
          <Text style={styles.sectionTitle}>Aksesuarlar</Text>
          <View style={styles.grid}>
            {SHOP_ITEMS.map((item) => {
              const owned = ownedItemIds.includes(item.id);
              const equipped = equippedItemId === item.id;
              return (
                <View key={item.id} style={[styles.itemCard, item.premium && styles.premiumCard]}>
                  {item.premium ? <Text style={styles.premiumLabel}>EN ÖZEL</Text> : null}
                  <View style={styles.itemVisual}>
                    <Image source={item.image} resizeMode="contain" style={styles.itemImage} />
                  </View>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemDescription}>{item.description}</Text>
                  <View style={styles.priceRow}><CoinIcon size={22} /><Text style={styles.price}>{item.price}</Text></View>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => buyItem(item)}
                    style={({ pressed }) => [styles.action, owned && styles.actionOwned, equipped && styles.actionEquipped, pressed && styles.actionPressed]}
                  >
                    <Text style={[styles.actionText, owned && styles.actionOwnedText]}>{equipped ? 'Çıkar' : owned ? 'Kuşan' : 'Satın al'}</Text>
                  </Pressable>
                </View>
              );
            })}
          </View>
          <Text style={styles.footnote}>Aksesuarlar satın alındıktan sonra dilediğin zaman çıkarılıp yeniden kuşanılabilir.</Text>
        </ScrollView>
      </SafeAreaView>
    </AppBackground>
  );
}
