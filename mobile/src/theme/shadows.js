import { Platform } from 'react-native';

export const shadows = {
  card: Platform.select({
    ios: {
      shadowColor: '#242333',
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.06,
      shadowRadius: 20,
    },
    android: { elevation: 2 },
    default: {},
  }),
};
