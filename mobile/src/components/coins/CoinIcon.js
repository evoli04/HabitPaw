import { Text, View } from 'react-native';

export default function CoinIcon({ size = 26 }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FFD54F',
        borderWidth: Math.max(2, size * 0.08),
        borderColor: '#E6A817',
        shadowColor: '#FFB300',
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 4,
      }}
    >
      <Text style={{ fontSize: size * 0.48, color: '#8A5700', fontWeight: '900' }}>🐾</Text>
    </View>
  );
}
